/* ==========================================================
   Pawsitive Pet Academy – Site scripts
   Navigation + drop-down, form validation, fee calculator
   ========================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Safe storage (can throw in private mode / blocked storage) ---------- */
  function storeSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  function money(n) {
    return 'R' + Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ---------- Navigation + drop-down ---------- */
  function initNav() {
    var toggle = $('.nav-toggle');
    var menu = $('#nav-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    }
    $$('.has-dropdown').forEach(function (item) {
      var btn = $('.dropdown-toggle', item);
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
    });
    document.addEventListener('click', function (e) {
      $$('.has-dropdown.open').forEach(function (item) {
        if (!item.contains(e.target)) {
          item.classList.remove('open');
          var b = $('.dropdown-toggle', item);
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      $$('.has-dropdown.open').forEach(function (item) {
        item.classList.remove('open');
        var b = $('.dropdown-toggle', item);
        if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
      });
    });
    var yr = $('#year');
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ---------- Validation helpers ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // South African numbers: 0XXXXXXXXX or +27XXXXXXXXX (spaces, dashes, brackets allowed)
  var PHONE_RE = /^(\+27|0)[1-9]\d{8}$/;

  var rules = {
    required: function (label) {
      return function (v) { return v.trim() ? '' : label + ' is required.'; };
    },
    email: function (v) {
      if (!v.trim()) return 'Email address is required.';
      return EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address, e.g. name@example.com.';
    },
    phone: function (v) {
      if (!v.trim()) return 'Phone number is required.';
      return PHONE_RE.test(v.replace(/[\s\-()]/g, '')) ? '' : 'Enter a valid South African number, e.g. 082 123 4567 or +27 82 123 4567.';
    },
    minLen: function (label, n) {
      return function (v) {
        if (!v.trim()) return label + ' is required.';
        return v.trim().length >= n ? '' : label + ' must be at least ' + n + ' characters.';
      };
    },
    checked: function (msg) {
      return function (_v, el) { return el.checked ? '' : msg; };
    }
  };

  function fieldWrap(el) { return el.closest('.field') || el.closest('.check'); }

  function setError(el, msg) {
    var wrap = fieldWrap(el);
    var out = wrap && $('.error-msg', wrap);
    if (wrap) wrap.classList.toggle('has-error', !!msg);
    if (out) { out.textContent = msg || ''; out.classList.toggle('show', !!msg); }
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  /* spec: { fieldId: [ruleFn, ...] } -> returns true when all valid */
  function validate(form, spec) {
    var firstBad = null;
    Object.keys(spec).forEach(function (id) {
      var el = form.elements[id] || document.getElementById(id);
      if (!el) return; // never crash on a missing field
      var msg = '';
      for (var i = 0; i < spec[id].length && !msg; i++) {
        msg = spec[id][i](el.value || '', el);
      }
      setError(el, msg);
      if (msg && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function liveValidate(form, spec) {
    Object.keys(spec).forEach(function (id) {
      var el = form.elements[id] || document.getElementById(id);
      if (!el) return;
      var check = function () {
        var msg = '';
        for (var i = 0; i < spec[id].length && !msg; i++) msg = spec[id][i](el.value || '', el);
        setError(el, msg);
      };
      el.addEventListener('blur', check);
      el.addEventListener('change', function () { if (fieldWrap(el).classList.contains('has-error')) check(); });
      el.addEventListener('input', function () { if (fieldWrap(el).classList.contains('has-error')) check(); });
    });
  }

  function status(form, type, text) {
    var box = $('.form-status', form.parentNode) || $('.form-status', form);
    if (!box) return;
    box.className = 'form-status show ' + type;
    box.textContent = text; // textContent: user input is never injected as HTML
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function wireForm(formId, spec, onValid) {
    var form = document.getElementById(formId);
    if (!form) return null;
    form.setAttribute('novalidate', 'novalidate'); // we show our own messages
    liveValidate(form, spec);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      try {
        if (!validate(form, spec)) {
          status(form, 'error', 'Please fix the highlighted fields and try again.');
          return;
        }
        onValid(form);
      } catch (err) {
        status(form, 'error', 'Something went wrong while processing the form. Please try again.');
        if (window.console) console.error(err);
      }
    });
    return form;
  }

  /* ---------- Contact ---------- */
  function initContact() {
    wireForm('contact-form', {
      name: [rules.minLen('Name', 2)],
      email: [rules.email],
      topic: [rules.required('Please choose a topic')],
      message: [rules.minLen('Message', 10)]
    }, function (form) {
      status(form, 'success', 'Thank you, ' + form.elements.name.value.trim() + '! Your message has been sent. We will reply within 2 working days.');
      form.reset();
    });
  }

  /* ---------- Enrolment ---------- */
  function initEnrolment() {
    var form = wireForm('enrol-form', {
      fullname: [rules.minLen('Full name', 2)],
      email: [rules.email],
      phone: [rules.phone],
      course: [rules.required('Please choose a course')],
      terms: [rules.checked('Please confirm the information is correct.')]
    }, function (f) {
      var sel = f.elements.course;
      var courseName = sel.options[sel.selectedIndex].text;
      status(f, 'success', 'Thank you, ' + f.elements.fullname.value.trim() + '! Your enrolment for "' + courseName + '" has been received. We will contact you to confirm your place.');
      f.reset();
    });
    if (!form) return;

    // Pre-fill from ?course=id[,id2] (set by the Fees page or a course page)
    try {
      var param = new URLSearchParams(window.location.search).get('course');
      if (!param) return;
      var ids = param.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      var sel = form.elements.course;
      var valid = ids.filter(function (id) { return $$('option', sel).some(function (o) { return o.value === id; }); });
      if (!valid.length) {
        status(form, 'error', 'We could not find the course you selected. Please choose one from the list.');
        return;
      }
      sel.value = valid[0];
      if (valid.length > 1) {
        var names = valid.slice(1).map(function (id) { return $('option[value="' + id + '"]', sel).text; });
        form.elements.message.value = 'Also interested in: ' + names.join('; ');
        status(form, 'info', 'You selected ' + valid.length + ' courses. Your first choice is pre-filled; the others are noted in Additional Information.');
      }
    } catch (e) { /* fall back to manual selection */ }
  }

  // Recalculate the fees whenever the selected courses change.
  function initFees() {
    var form = document.getElementById('fees-form');
    if (!form) return;
    var boxes = $$('input[name="course"]', form);
    var rows = $('#summary-rows');
    var subEl = $('#subtotal'), discEl = $('#discount-amount'), totEl = $('#total');
    var err = $('#fees-error');

    function selected() { return boxes.filter(function (b) { return b.checked; }); }
    function discountRate(courseCount) {
      if (courseCount === 2) return 5;
      if (courseCount === 3) return 10;
      if (courseCount > 3) return 15;
      return 0;
    }

    function update() {
      var chosen = selected();
      var subtotal = 0;
      rows.textContent = '';
      chosen.forEach(function (b) {
        var price = parseFloat(b.dataset.price);
        if (isNaN(price)) { price = 0; } // guard against bad data
        subtotal += price;
        var tr = document.createElement('tr');
        var a = document.createElement('td'); a.textContent = b.dataset.name;
        var c = document.createElement('td'); c.className = 'num'; c.textContent = money(price);
        tr.appendChild(a); tr.appendChild(c); rows.appendChild(tr);
      });
      if (!chosen.length) {
        var tr = document.createElement('tr');
        var td = document.createElement('td'); td.colSpan = 2; td.textContent = 'No courses selected yet.';
        tr.appendChild(td); rows.appendChild(tr);
      }
      var rate = discountRate(chosen.length);
      var discount = subtotal * rate / 100;
      var rateLabel = $('#discount-rate');
      if (rateLabel) {
        rateLabel.textContent = rate + '% (' + chosen.length + ' course' +
          (chosen.length === 1 ? '' : 's') + ')';
      }
      subEl.textContent = money(subtotal);
      discEl.textContent = '- ' + money(discount);
      totEl.textContent = money(subtotal - discount);
      if (chosen.length) { err.classList.remove('show'); err.textContent = ''; }
    }

    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    var go = $('#proceed');
    if (go) {
      go.addEventListener('click', function () {
        var chosen = selected();
        if (!chosen.length) {
          err.textContent = 'Please select at least one course before proceeding to enrolment.';
          err.classList.add('show');
          boxes[0].focus();
          return;
        }
        var ids = chosen.map(function (b) { return b.value; });
        storeSet('selectedCourses', ids.join(','));
        window.location.href = 'enrolment.html?course=' + encodeURIComponent(ids.join(','));
      });
    }
    update();
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initContact();
    initEnrolment();
    initFees();
  });

  // Last-resort handler so one script error never leaves the page unusable
  window.addEventListener('error', function (e) {
    if (window.console) console.error('Script error:', e.message);
  });
})();
