// ==============================================================================
// UNERMB - PNF EN INFORMÁTICA | ASISTENCIA DOCENTE QR
// MÓDULO DE REGISTRO DOCENTE CON SELECTOR EN CASCADA (PENSUM 2026 OFICIAL)
// Trayecto -> Trimestre -> Materia (Límite estricto de hasta 5 materias)
// ==============================================================================

const RegisterModule = {
  maxMaterias: 5,
  selectedMaterias: [], // Lista de IDs de materias seleccionadas
  uploadedFotoFile: null,

  init() {
    this.setupFotoCarnetUpload();
    this.setupMateriasManager();
    this.setupFormValidations();
  },

  // ----------------------------------------------------------------------------
  // GESTIÓN DE SUBIDA Y PREVIEW DE FOTOGRAFÍA TIPO CARNET
  // ----------------------------------------------------------------------------
  setupFotoCarnetUpload() {
    const fileInput = document.getElementById('reg-foto-carnet');
    const uploadBox = document.getElementById('carnet-upload-dropzone');
    const previewImg = document.getElementById('carnet-preview-img');
    const previewPlaceholder = document.getElementById('carnet-preview-placeholder');

    if (!fileInput || !uploadBox) return;

    uploadBox.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      this.handleFileSelected(file, previewImg, previewPlaceholder);
    });

    // Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadBox.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadBox.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadBox.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
      }, false);
    });

    uploadBox.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      if (file) {
        fileInput.files = dt.files;
        this.handleFileSelected(file, previewImg, previewPlaceholder);
      }
    });
  },

  handleFileSelected(file, previewImg, previewPlaceholder) {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Formato inválido. Solo se admiten fotos en formato JPG, PNG o WEBP.', 'error');
      this.uploadedFotoFile = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La fotografía excede el tamaño máximo permitido de 5 MB.', 'error');
      this.uploadedFotoFile = null;
      return;
    }

    this.uploadedFotoFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg && previewPlaceholder) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        previewPlaceholder.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
    showToast('Fotografía tipo carnet cargada correctamente.', 'success');
  },

  // ----------------------------------------------------------------------------
  // GESTIÓN DINÁMICA DE MATERIAS EN CASCADA (1 A 5 MATERIAS)
  // ----------------------------------------------------------------------------
  setupMateriasManager() {
    window.addEventListener('pensumEstructuraLoaded', () => {
      this.renderMateriasInterface();
    });

    if (window.PensumCascade && window.PensumCascade.isLoaded) {
      this.renderMateriasInterface();
    } else {
      window.PensumCascade.init().then(() => this.renderMateriasInterface());
    }

    const addBtn = document.getElementById('btn-add-materia-row');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addMateriaRow());
    }
  },

  renderMateriasInterface() {
    const container = document.getElementById('materias-rows-container');
    if (!container) return;

    if (!window.PensumCascade || !window.PensumCascade.isLoaded) {
      container.innerHTML = `<div style="text-align: center; padding: 1rem; color: var(--text-muted);">Cargando catálogo oficial pensum2026.txt...</div>`;
      return;
    }

    if (this.selectedMaterias.length === 0) {
      this.selectedMaterias = [null];
    }

    container.innerHTML = '';
    const cascadeWrapper = document.createElement('div');
    cascadeWrapper.className = 'cascade-container';

    this.selectedMaterias.forEach((materiaId, index) => {
      const alreadySelected = this.selectedMaterias.filter((id, idx) => idx !== index && id !== null);

      const row = window.PensumCascade.createCascadeRow({
        rowIndex: index,
        selectedMateriaId: materiaId,
        alreadySelectedIds: alreadySelected,
        canRemove: this.selectedMaterias.length > 1,
        onChange: (newMateriaId) => {
          this.selectedMaterias[index] = newMateriaId;
          this.updateMateriasControls();
        },
        onRemove: () => {
          this.removeMateriaRow(index);
        }
      });

      cascadeWrapper.appendChild(row);
    });

    container.appendChild(cascadeWrapper);
    this.updateMateriasControls();
  },

  addMateriaRow() {
    if (this.selectedMaterias.length >= this.maxMaterias) {
      showToast('Ha alcanzado el límite máximo de 5 materias permitidas.', 'warning');
      return;
    }

    const hasEmpty = this.selectedMaterias.some(m => !m);
    if (hasEmpty) {
      showToast('Por favor complete la selección en cascada de la materia actual antes de agregar otra fila.', 'warning');
      return;
    }

    this.selectedMaterias.push(null);
    this.renderMateriasInterface();
  },

  removeMateriaRow(index) {
    if (this.selectedMaterias.length <= 1) return;
    this.selectedMaterias.splice(index, 1);
    this.renderMateriasInterface();
  },

  updateMateriasControls() {
    const countBadge = document.getElementById('materias-count-badge');
    const addBtn = document.getElementById('btn-add-materia-row');
    const limitNotice = document.getElementById('materias-limit-notice');

    const validMaterias = this.selectedMaterias.filter(m => m !== null);
    const validCount = validMaterias.length;
    const totalRows = this.selectedMaterias.length;

    if (countBadge) {
      countBadge.textContent = `${validCount} / ${this.maxMaterias} Materias`;
      if (validCount > 0) {
        countBadge.classList.add('badge-activo');
      } else {
        countBadge.classList.remove('badge-activo');
      }
    }

    if (addBtn) {
      const canAddMore = totalRows < this.maxMaterias && validCount === totalRows;
      addBtn.style.display = totalRows >= this.maxMaterias ? 'none' : 'inline-flex';
      addBtn.disabled = !canAddMore;
    }

    if (limitNotice) {
      if (totalRows >= this.maxMaterias) {
        limitNotice.style.display = 'block';
        limitNotice.innerHTML = `<strong>Límite alcanzado:</strong> Se ha completado el cupo máximo de 5 materias oficiales para el docente.`;
      } else {
        limitNotice.style.display = 'none';
      }
    }
  },

  // ----------------------------------------------------------------------------
  // VALIDACIONES EN TIEMPO REAL Y ENVÍO DEL FORMULARIO
  // ----------------------------------------------------------------------------
  setupFormValidations() {
    const regForm = document.getElementById('docente-registration-form');
    if (!regForm) return;

    const nombreInput = document.getElementById('reg-nombre');
    const apellidoInput = document.getElementById('reg-apellido');
    const cedulaInput = document.getElementById('reg-cedula');
    const emailInput = document.getElementById('reg-email');
    const passInput = document.getElementById('reg-password');
    const confirmPassInput = document.getElementById('reg-confirm-password');

    const regexAlfa = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const regexCedula = /^\d{1,9}$/;
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const checkConfirm = () => {
      const p1 = passInput ? passInput.value : '';
      const p2 = confirmPassInput ? confirmPassInput.value : '';
      const errEl = document.getElementById('error-reg-confirm-password');

      if (!p2) {
        if (errEl) errEl.textContent = '';
        confirmPassInput.classList.remove('is-invalid', 'is-valid');
        return;
      }

      if (p1 !== p2) {
        if (errEl) {
          errEl.textContent = 'Las contraseñas no coinciden.';
          errEl.className = 'validation-error';
        }
        confirmPassInput.classList.add('is-invalid');
        confirmPassInput.classList.remove('is-valid');
      } else {
        if (errEl) {
          errEl.textContent = 'Las contraseñas coinciden correctamente.';
          errEl.className = 'validation-success';
        }
        confirmPassInput.classList.remove('is-invalid');
        confirmPassInput.classList.add('is-valid');
      }
    };

    if (nombreInput) {
      nombreInput.addEventListener('input', () => {
        const val = nombreInput.value.trim();
        const errEl = document.getElementById('error-reg-nombre');
        if (val && !regexAlfa.test(val)) {
          errEl.textContent = 'Solo letras y espacios (sin números ni caracteres especiales).';
          nombreInput.classList.add('is-invalid');
        } else {
          errEl.textContent = '';
          nombreInput.classList.remove('is-invalid');
        }
      });
    }

    if (apellidoInput) {
      apellidoInput.addEventListener('input', () => {
        const val = apellidoInput.value.trim();
        const errEl = document.getElementById('error-reg-apellido');
        if (val && !regexAlfa.test(val)) {
          errEl.textContent = 'Solo letras y espacios.';
          apellidoInput.classList.add('is-invalid');
        } else {
          errEl.textContent = '';
          apellidoInput.classList.remove('is-invalid');
        }
      });
    }

    if (cedulaInput) {
      cedulaInput.addEventListener('input', () => {
        const val = cedulaInput.value.trim();
        const errEl = document.getElementById('error-reg-cedula');
        if (val && !regexCedula.test(val)) {
          errEl.textContent = 'Solo números (máximo 9 dígitos).';
          cedulaInput.classList.add('is-invalid');
        } else {
          errEl.textContent = '';
          cedulaInput.classList.remove('is-invalid');
        }
      });
    }

    if (emailInput) {
      emailInput.addEventListener('input', () => {
        const val = emailInput.value.trim();
        const errEl = document.getElementById('error-reg-email');
        if (val && !regexEmail.test(val)) {
          errEl.textContent = 'Formato de correo no válido.';
          emailInput.classList.add('is-invalid');
        } else {
          errEl.textContent = '';
          emailInput.classList.remove('is-invalid');
        }
      });
    }

    if (passInput) {
      passInput.addEventListener('input', () => {
        const val = passInput.value;
        window.updatePasswordSecurityUI('reg', val);
        checkConfirm();
      });
    }

    if (confirmPassInput) {
      confirmPassInput.addEventListener('input', checkConfirm);
    }

    regForm.addEventListener('submit', (e) => this.handleRegistrationSubmit(e));
  },

  async handleRegistrationSubmit(e) {
    e.preventDefault();

    const nombre = document.getElementById('reg-nombre').value.trim();
    const apellido = document.getElementById('reg-apellido').value.trim();
    const cedula = document.getElementById('reg-cedula').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm_password = document.getElementById('reg-confirm-password').value;
    const submitBtn = document.getElementById('btn-submit-registration');

    // Validar foto tipo carnet
    if (!this.uploadedFotoFile) {
      showToast('La Fotografía Tipo Carnet es obligatoria para el registro.', 'error');
      document.getElementById('carnet-upload-dropzone').scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Validar materias seleccionadas (en cascada)
    const validMaterias = this.selectedMaterias.filter(m => m !== null);
    if (validMaterias.length === 0) {
      showToast('Debe seleccionar al menos una materia mediante el selector en cascada.', 'error');
      return;
    }

    if (password !== confirm_password) {
      showToast('Las contraseñas no coinciden.', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Procesando registro seguro en base de datos...</span>`;

    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('apellido', apellido);
      formData.append('cedula', cedula);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('confirm_password', confirm_password);
      formData.append('foto_carnet', this.uploadedFotoFile);
      formData.append('materias', JSON.stringify(validMaterias));

      const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '';
      const res = await fetch(`${apiBase}/api/auth/registro`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        showToast('¡Registro completado exitosamente!', 'success', 7000);
        
        // Cargar datos en pantalla de éxito
        document.getElementById('reg-success-fullname').textContent = `${nombre} ${apellido}`;
        document.getElementById('reg-success-cedula').textContent = cedula;
        document.getElementById('reg-success-email').textContent = email;
        document.getElementById('reg-success-materias-count').textContent = `${validMaterias.length} materias del PNF Informática`;

        // Limpiar formulario
        document.getElementById('docente-registration-form').reset();
        this.uploadedFotoFile = null;
        this.selectedMaterias = [null];
        this.renderMateriasInterface();

        navigateTo('view-registration-success');
      } else {
        showToast(data.error || 'Ocurrió un error al registrarse.', 'error', 7000);
      }
    } catch (err) {
      console.error('Error enviando registro:', err);
      showToast('Error de conexión con el servidor. Verifique que esté activo.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Completar Registro Docente</span>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  RegisterModule.init();
});
