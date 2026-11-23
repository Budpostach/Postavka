const GOOGLE_FORM_CFG = Object.assign({
  actionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSezv8bDo25NNwaiJG61_NbVcL-v-tF2sZG2RBbT69QlIitIRw/formResponse',
  fields: {
    name: 'entry.379256972',
    email: 'entry.397614626',
    phone: 'entry.41542907',
    message: 'entry.1553886599'
  }
}, window.POSTAVKA_GOOGLE_FORM || {});

const form = document.querySelector('#quote-form');
const volume = document.querySelector('#volume');
const summary = document.querySelector('#summary');
const request = document.querySelector('#request');
const status = document.querySelector('#status');
const submitBtn = form.querySelector('button[type="submit"]');
const dimensions = ['length', 'width', 'height'];
const format = new Intl.NumberFormat('uk-UA', { maximumSignificantDigits: 8 });

function cargoVolume() {
  const values = dimensions.map(name => form.elements[name].valueAsNumber);
  const boxes = form.elements.boxes.valueAsNumber;
  if (values.some(value => !(value > 0)) || !(boxes > 0)) return null;
  const cubicMeters = values.reduce((result, value) => result * value, boxes) / 1_000_000;
  return Number.isFinite(cubicMeters) ? cubicMeters : null;
}

function normalizePhone(raw) {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('380')) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `+38${digits}`;
  if (digits.length === 9) return `+380${digits}`;
  return '';
}

form.addEventListener('input', event => {
  if (event.target && typeof event.target.setCustomValidity === 'function') {
    event.target.setCustomValidity('');
  }
  const hasDimensions = dimensions.some(name => form.elements[name].value !== '');
  for (const name of dimensions) form.elements[name].required = hasDimensions;
  form.elements.boxes.required = hasDimensions;
  const measuredVolume = cargoVolume();
  volume.textContent = measuredVolume === null ? '' : 'Загальний об’єм: ' + format.format(measuredVolume) + ' м³';
  request.hidden = true;
});

const initialMode = new URLSearchParams(location.search).get('mode');
if (initialMode && [...form.elements.mode.options].some(opt => opt.value === initialMode)) {
  form.elements.mode.value = initialMode;
}

for (const link of document.querySelectorAll('[data-mode]')) {
  link.addEventListener('click', () => {
    form.elements.mode.value = link.dataset.mode;
    request.hidden = true;
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(form);
  const city = data.get('city').trim();
  const product = data.get('product').trim();
  const name = (data.get('name') || '').trim();
  const rawPhone = (data.get('phone') || '').trim();
  const phone = normalizePhone(rawPhone);

  form.elements.city.setCustomValidity(city ? '' : 'Вкажіть місто доставки.');
  form.elements.product.setCustomValidity(product ? '' : 'Опишіть товар.');
  form.elements.phone.setCustomValidity(phone ? '' : 'Вкажіть коректний номер телефону.');
  if (!form.reportValidity()) return;

  const lines = [
    'Запит на розрахунок доставки',
    'Спосіб: ' + data.get('mode'),
    'Місто доставки: ' + city,
    'Товар: ' + product
  ];
  if (data.get('weight')) lines.push('Загальна вага: ' + data.get('weight') + ' кг');
  const measuredVolume = cargoVolume();
  if (measuredVolume !== null) {
    lines.push(
      'Коробки: ' + data.get('boxes') + ' шт., ' + dimensions.map(name => data.get(name)).join(' × ') + ' см',
      'Загальний об’єм: ' + format.format(measuredVolume) + ' м³'
    );
  }
  if (name) lines.push('Ім’я: ' + name);
  lines.push('Телефон: ' + phone);

  const summaryText = lines.join('\n');
  summary.value = summaryText;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Надсилаємо…';
  try {
    const body = new URLSearchParams();
    body.append(GOOGLE_FORM_CFG.fields.name, name || 'Розрахунок доставки');
    body.append(GOOGLE_FORM_CFG.fields.email, '');
    body.append(GOOGLE_FORM_CFG.fields.phone, phone);
    body.append(GOOGLE_FORM_CFG.fields.message, summaryText);
    await fetch(GOOGLE_FORM_CFG.actionUrl, {
      method: 'POST',
      mode: 'no-cors',
      body
    });
    status.textContent = 'Дякуємо! Запит надіслано менеджеру. За потреби скопіюйте деталі нижче або зателефонуйте.';
    status.className = 'is-success';
    request.hidden = false;
  } catch {
    status.textContent = 'Не вдалося надіслати автоматично. Скопіюйте запит нижче або зателефонуйте менеджеру.';
    status.className = 'is-error';
    request.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Надіслати запит';
  }
});

document.querySelector('#copy').addEventListener('click', async () => {
  if (!summary.value) return;
  try {
    await navigator.clipboard.writeText(summary.value);
    status.textContent = 'Запит скопійовано.';
  } catch {
    summary.focus();
    summary.select();
    status.textContent = 'Текст виділено. Скопіюйте його вручну.';
  }
});
