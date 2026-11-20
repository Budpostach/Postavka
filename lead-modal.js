const GOOGLE_FORM = Object.assign({
  actionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSezv8bDo25NNwaiJG61_NbVcL-v-tF2sZG2RBbT69QlIitIRw/formResponse',
  fields: {
    name: 'entry.379256972',
    email: 'entry.397614626',
    phone: 'entry.41542907',
    message: 'entry.1553886599'
  }
}, window.POSTAVKA_GOOGLE_FORM || {});

(() => {
  const modal = document.createElement('div');
  modal.id = 'lead-modal';
  modal.className = 'lead-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'lead-modal-title');

  modal.innerHTML = `
    <div class="lead-dialog">
      <button type="button" class="lead-close" aria-label="Закрити форму">&times;</button>
      <h2 id="lead-modal-title">Залишити заявку</h2>
      <p class="lead-subtitle">Заповніть форму — менеджер зв’яжеться з вами щодо доставки та розрахунку.</p>
      <form id="lead-popup-form" novalidate>
        <label>Ваше ім’я
          <input type="text" name="name" required maxlength="100" autocomplete="name" placeholder="Ім’я або компанія">
        </label>
        <label>Ваш e-mail
          <input type="email" name="email" required maxlength="120" autocomplete="email" placeholder="name@company.com">
        </label>
        <div class="lead-field-group">
          <span class="lead-field-label">Телефон</span>
          <div class="phone-input">
            <span class="dial-prefix" aria-hidden="true">
              <svg width="20" height="14" viewBox="0 0 20 14"><rect width="20" height="7" fill="#0057b7"/><rect y="7" width="20" height="7" fill="#ffd700"/></svg>
              <span>+38</span>
            </span>
            <input type="tel" name="phone" required maxlength="20" inputmode="tel" autocomplete="tel-national" placeholder="0000000000">
          </div>
        </div>
        <label>Повідомлення
          <textarea name="message" required rows="4" maxlength="1500" placeholder="Опишіть товар, орієнтовну вагу або запитання"></textarea>
        </label>
        <label class="lead-consent">
          <input type="checkbox" name="consent" required>
          <span>Натискаючи кнопку, Ви погоджуєтесь із <a href="/polityka-konfidentsiynosti/">політикою конфіденційності</a></span>
        </label>
        <div class="lead-actions">
          <button type="submit" class="button lead-submit">Надіслати</button>
          <a class="button lead-wa" id="lead-wa" href="https://wa.me/380660647854" target="_blank" rel="noopener noreferrer">Надіслати у WhatsApp</a>
        </div>
        <p class="lead-status" id="lead-status" role="status" hidden></p>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector('#lead-popup-form');
  const closeBtn = modal.querySelector('.lead-close');
  const submitBtn = modal.querySelector('.lead-submit');
  const statusEl = modal.querySelector('#lead-status');
  const waBtn = modal.querySelector('#lead-wa');
  let lastTrigger = null;
  let lastSummary = '';

  function normalizePhoneDigits(raw) {
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('380')) digits = digits.slice(2);
    return digits;
  }

  function buildWhatsAppText() {
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const digits = normalizePhoneDigits(form.elements.phone.value.trim());
    const message = form.elements.message.value.trim();
    if (!name && !email && !digits && !message) {
      return lastSummary || 'Вітаю! Хочу проконсультуватися щодо доставки з Китаю.';
    }
    const lines = ['Нова заявка з сайту Postavka'];
    if (name) lines.push(`Ім’я: ${name}`);
    if (email) lines.push(`E-mail: ${email}`);
    if (digits) lines.push(`Телефон: +38${digits}`);
    if (message) lines.push(`Повідомлення: ${message}`);
    return lines.join('\n');
  }

  waBtn.addEventListener('click', () => {
    waBtn.href = 'https://wa.me/380660647854?text=' + encodeURIComponent(buildWhatsAppText());
  });

  function openModal(trigger) {
    lastTrigger = trigger || document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const firstInput = form.elements.name;
    requestAnimationFrame(() => firstInput.focus());
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus();
    }
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-lead]');
    if (trigger) {
      event.preventDefault();
      openModal(trigger);
    }
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  for (const field of [form.elements.name, form.elements.email, form.elements.phone, form.elements.message, form.elements.consent]) {
    field.addEventListener('input', () => {
      field.setCustomValidity('');
      statusEl.hidden = true;
    });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const digits = normalizePhoneDigits(form.elements.phone.value.trim());
    const message = form.elements.message.value.trim();
    const consent = form.elements.consent.checked;

    form.elements.name.setCustomValidity(name ? '' : 'Вкажіть ваше ім’я.');
    form.elements.email.setCustomValidity(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Вкажіть коректний e-mail.');
    form.elements.phone.setCustomValidity(digits.length >= 9 ? '' : 'Вкажіть коректний номер телефону.');
    form.elements.message.setCustomValidity(message ? '' : 'Введіть повідомлення.');
    form.elements.consent.setCustomValidity(consent ? '' : 'Підтвердіть згоду з політикою конфіденційності.');

    if (!form.reportValidity()) return;

    const fullPhone = `+38${digits}`;
    lastSummary = [
      'Нова заявка з сайту Postavka',
      `Ім’я: ${name}`,
      `E-mail: ${email}`,
      `Телефон: ${fullPhone}`,
      `Повідомлення: ${message}`
    ].join('\n');

    if (GOOGLE_FORM.actionUrl) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Надсилаємо…';
      statusEl.hidden = true;
      try {
        const body = new URLSearchParams();
        body.append(GOOGLE_FORM.fields.name, name);
        body.append(GOOGLE_FORM.fields.email, email);
        body.append(GOOGLE_FORM.fields.phone, fullPhone);
        body.append(GOOGLE_FORM.fields.message, message);
        await fetch(GOOGLE_FORM.actionUrl, {
          method: 'POST',
          mode: 'no-cors',
          body
        });
        statusEl.textContent = 'Дякуємо! Заявку успішно надіслано. Менеджер зв’яжеться з вами найближчим часом.';
        statusEl.className = 'lead-status is-success';
        statusEl.hidden = false;
        form.reset();
      } catch {
        statusEl.textContent = 'Не вдалося автоматично надіслати форму. Надішліть заявку у WhatsApp.';
        statusEl.className = 'lead-status is-error';
        statusEl.hidden = false;
        waBtn.href = 'https://wa.me/380660647854?text=' + encodeURIComponent(lastSummary);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Надіслати';
      }
      return;
    }

    waBtn.href = 'https://wa.me/380660647854?text=' + encodeURIComponent(lastSummary);
    statusEl.textContent = 'Заявку сформовано! Надішліть її у WhatsApp для менеджера.';
    statusEl.className = 'lead-status is-success';
    statusEl.hidden = false;
  });
})();
