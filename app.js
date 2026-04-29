/* ================== CONFIGURACIÓN PRINCIPAL ================== */
const API_BASE = 'https://script.google.com/macros/s/AKfycbw0AX4aP4R5GKAscjqp7JbUa-fHyBc9KYk5iHHqwW__7xn_9r11Qxp1_YAEFMh-mEds/exec';
const BUILDERBOT_ENDPOINT = 'https://app.builderbot.cloud/api/v2/ff37a123-12b0-4fdc-9866-f3e2daf389fb/messages';
const BUILDERBOT_API_KEY  = 'bb-7f9ef630-5cfc-4ba4-9258-5e7cecbb4f65';

/* ================== SONIDOS ================== */
const SOUNDS = {
  question: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011577/Pay_fail_ls2aif.mp3',
  info: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011578/Default_notification_pkp4wr.mp3',
  success: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011577/Pay_success_t5aawh.mp3',
  error: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011578/Low_battery_d5qua1.mp3',
  warning: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011578/Low_battery_d5qua1.mp3',
  login: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011577/Siri_star_g1owy4.mp3',
  logout: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011577/Siri_End_kelv02.mp3',
  back: 'https://res.cloudinary.com/dqqeavica/video/upload/v1759011578/Keyboard_Enter_b9k2dc.mp3'
};
function playSoundOnce(url){
  try{
    const a = new Audio(url);
    a.preload = 'auto';
    a.play().catch(()=>{});
  }catch(e){}
}
if (window.Swal && typeof Swal.fire === 'function'){
  const __fire = Swal.fire.bind(Swal);
  Swal.fire = function(options = {}, ...rest){
    try{
      const icon = options.icon || options.type;
      if (icon && SOUNDS[icon]) playSoundOnce(SOUNDS[icon]);
    }catch(e){}
    return __fire(options, ...rest);
  }
}

/* ================== LOADER ================== */
const loader = document.getElementById('loader');
let loadingCount = 0;
let loaderTimer = null;

function startLoading(){
  loadingCount++;
  if (loadingCount === 1){
    loaderTimer = setTimeout(()=>{
      loader.classList.remove('hidden');
      loaderTimer = null;
    }, 120);
  }
}
function stopLoading(){
  if (loadingCount === 0) return;
  loadingCount--;
  if (loadingCount === 0){
    if (loaderTimer){
      clearTimeout(loaderTimer);
      loaderTimer = null;
    }
    loader.classList.add('hidden');
  }
}

/* ================== API HELPERS ================== */
async function apiGet(action, params = {}){
  startLoading();
  try{
    const url = new URL(API_BASE);
    url.search = new URLSearchParams({ action, ...params }).toString();
    const r = await fetch(url.toString(), { method: 'GET' });
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || 'Error');
    return j.data;
  } finally { stopLoading(); }
}
async function apiPost(action, body = {}){
  startLoading();
  try{
    const url = API_BASE + '?action=' + encodeURIComponent(action);
    const r = await fetch(url, {
      method:'POST',
      headers: { 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || 'Error');
    return j.data;
  } finally { stopLoading(); }
}

/* ================== BUILDERBOT ================== */
function normalizeContratistaNumber(raw){
  let num = String(raw || '').replace(/\D/g,'');
  if(!num) return '';
  if(num.length === 10 && !num.startsWith('57')){
    num = '57' + num;
  }
  if(!(num.length === 12 && num.startsWith('57'))){
    return '';
  }
  return num;
}

function sendBuilderbotMessage(destino, mensaje){
  const numberField = String(destino || '').trim();
  if(!numberField){
    console.warn('Destino vacío, no se envía BuilderBot');
    return;
  }
  fetch(BUILDERBOT_ENDPOINT, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-builderbot':BUILDERBOT_API_KEY
    },
    body: JSON.stringify({
      messages: { content: mensaje },
      number: numberField,
      checkIfExists: false
    })
  }).catch(err => console.warn('Error enviando BuilderBot', err));
}

/* ================== ESTADO GLOBAL ================== */
let currentUser = null;

/* ================== VISTAS ================== */
function showView(id){
  for(const el of document.querySelectorAll('.view')) el.classList.remove('active');
  const v = document.getElementById(id);
  if(v) v.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================== LOGIN ================== */
const btnLogin = document.getElementById('btn-login');
const loginCedula = document.getElementById('login-cedula');

/* ================== BOTÓN OCULTAR - MOSTRAR ================== */
const toggleCedulaBtn = document.getElementById('toggle-cedula');
toggleCedulaBtn.addEventListener('click', ()=>{
  const oculto = loginCedula.type === 'password';
  loginCedula.type = oculto ? 'text' : 'password';
  const nuevoIcono = oculto
    ? 'https://res.cloudinary.com/dqqeavica/image/upload/v1764084782/Ocultar_lgdxpd.png'
    : 'https://res.cloudinary.com/dqqeavica/image/upload/v1764084782/Mostrar_yymceh.png';
  const accion = oculto ? 'Ocultar' : 'Mostrar';
  toggleCedulaBtn.setAttribute('aria-label', accion + ' cédula');
  toggleCedulaBtn.innerHTML = '<img src="'+nuevoIcono+'" alt="'+accion+'">';
});

btnLogin.addEventListener('click', async () => {
  const cedula = (loginCedula.value || '').trim();
  if (cedula === '') {
    Swal.fire({ icon:'warning', title:'¿Deseas iniciar Sesión?', text:'Ingresa tu Contraseña.' });
    return;
  }
  if (!/^\d{6,10}$/.test(cedula)) {
    Swal.fire({ icon:'warning', title:'Contraseña inválida', text:'Te mostraré unas opciones' });
    return;
  }
  try {
    const res = await apiGet('login', { cedula });
    if (!res || !res.encontrado){
      const soporte = '573103230712';
      const mensaje =
        'Buen día *Oscar*%0A%0ANo tengo acceso a la app de Contratación.%0A' +
        'Mi Contraseña: *' + cedula + '*%0A' +
        'Te dejo mis datos a continuación:%0A*Nombre Completo:*%0A*Celular:*';
      const esMovil = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
      const urlWA = esMovil
        ? 'whatsapp://send?phone=' + soporte + '&text=' + mensaje
        : 'https://api.whatsapp.com/send?phone=' + soporte + '&text=' + mensaje;

      const rs = await Swal.fire({
        icon: 'error',
        title: 'NO TIENES ACCESO',
        text: 'Toma una de las opciones',
        showConfirmButton: true,
        confirmButtonText: 'Solicitar Acceso',
        showDenyButton: true,
        denyButtonText: 'Rectificar / Salir'
      });

      if (rs.isConfirmed){
        window.open(urlWA, '_blank');
        await Swal.fire({
          icon: 'success',
          title: 'Se abrió WhatsApp',
          text: 'Solicita tu habilitación por ese medio.',
          timer: 6000,
          showConfirmButton: false
        });
        return;
      } else if (rs.isDenied){
        loginCedula.value = '';
        return;
      }
    }

    currentUser = {
      cedula,
      profesional: res.profesional || '',
      celular: res.celular || ''
    };
    playSoundOnce(SOUNDS.login);
    renderInicio();
    updateEmisionButtonVisibility();
    showView('view-inicio');
  } catch (e) {
    Swal.fire({ icon:'error', title:'Error', text:e.message });
  }
});

document.getElementById('btn-logout').addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.logout);
  currentUser = null;
  loginCedula.value = '';
  showView('view-login');
});

/* ================== INICIO ================== */
function renderInicio(){
  document.getElementById('inicio-profesional').textContent = 'PROFESIONAL: ' + (currentUser?.profesional || '');
  document.getElementById('inicio-fecha').textContent = formatoFechaHumana(new Date());
}
function formatoFechaHumana(date){
  const dias=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const d=dias[date.getDay()];
  const dia=('0'+date.getDate()).slice(-2);
  const mes=meses[date.getMonth()];
  const y=date.getFullYear();
  return `${d}, ${dia} de ${mes} de ${y}`;
}

/* ================== PERMISOS EMISIÓN ================== */
function updateEmisionButtonVisibility(){
  const btn = document.getElementById('go-emision');
  if(!btn) return;
  const name = String(currentUser?.profesional || '').trim().toUpperCase();
  const allowed = (name === 'OSCAR POLANIA' || name === 'CARLOS CUEVAS' || name === 'GLORIA HERRERA');
  btn.classList.toggle('hidden', !allowed);
}

/* ================== NAVEGACIÓN PRINCIPAL ================== */
document.getElementById('go-contratistas').addEventListener('click', async ()=>{
  playSoundOnce(SOUNDS.login);
  await cargarContratistas();
  showView('view-contratistas');
});

let ORDEN_MODE = 'CREACION'; // 'CREACION' (CERRADA) | 'EMISION' (PRE-ORDEN)

document.getElementById('go-revision').addEventListener('click', async ()=>{
  playSoundOnce(SOUNDS.login);
  ORDEN_MODE = 'CREACION';
  await cargarCuentasPendientes(); // usa ORDEN_MODE
  if (!CUENTAS_DATA || CUENTAS_DATA.length === 0){
    await Swal.fire({
      icon:'success',
      title:'¡Estás al día!',
      text:'No tienes CUENTAS pendientes por Orden de Pago',
      timer: 3200,
      showConfirmButton: false
    });
    showView('view-inicio');
    return;
  }
  showView('view-revision');
});

document.getElementById('go-emision').addEventListener('click', async ()=>{
  playSoundOnce(SOUNDS.login);
  ORDEN_MODE = 'EMISION';
  await cargarCuentasPendientes(); // lista PRE-ORDEN
  if (!CUENTAS_DATA || CUENTAS_DATA.length === 0){
    await Swal.fire({
      icon:'success',
      title:'¡Sin pendientes!',
      text:'No hay PRE-ORDENES pendientes por emitir.',
      timer: 3200,
      showConfirmButton: false
    });
    showView('view-inicio');
    return;
  }
  showView('view-revision');
});

document.getElementById('go-requerimientos').addEventListener('click', async ()=>{
  playSoundOnce(SOUNDS.login);
  await cargarRequerimientosBase();
  showView('view-requerimientos');
});
document.getElementById('go-comunicados').addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.login);
  showView('view-comunicados');
});
document.getElementById('go-soporte').addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.login);
  showView('view-soporte');
});

/* ================== REGISTROS ================== */
document.getElementById('go-registros').addEventListener('click', async ()=>{
  // sonido al presionar
  playSoundOnce(SOUNDS.login);

  const name = String(currentUser?.profesional || '').trim().toUpperCase();

  const LINKS = {
    'GLORIA HERRERA': 'https://docs.google.com/spreadsheets/d/1oAQA8QW-Aqt2nA2-603A6tNDNopVI1EOGCyA-6x5GcU/edit?usp=sharing',
    'OLGA ALCENDRA':  'https://docs.google.com/spreadsheets/d/1sUzFM-Xvs9ngyq0MhgIJ6fkU9SJEuZbJ9pO8mgRN39g/edit?usp=sharing',
    'DIANA ROJAS':    'https://docs.google.com/spreadsheets/d/1CE3qognKSCOSwnMHmUnF4lBVo3sGPiFFBgZD8S396cM/edit?usp=sharing',
  };

  // Casos directos
  if (LINKS[name]){
    window.open(LINKS[name], '_blank');
    return;
  }

  // Sandra / Oscar -> elegir entre las 3 opciones
  if (name === 'CARLOS CUEVAS' || name === 'OSCAR POLANIA'){
    const rs = await Swal.fire({
      icon: 'info',
      title: 'Selecciona el Registro',
      text: 'Elige cuál archivo deseas abrir',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'GLORIA HERRERA',
      denyButtonText: 'OLGA ALCENDRA',
      cancelButtonText: 'DIANA ROJAS'
    });

    if (rs.isConfirmed){
      window.open(LINKS['GLORIA HERRERA'], '_blank');
      return;
    }
    if (rs.isDenied){
      window.open(LINKS['OLGA ALCENDRA'], '_blank');
      return;
    }
    if (rs.dismiss === Swal.DismissReason.cancel){
      window.open(LINKS['DIANA ROJAS'], '_blank');
      return;
    }
    return;
  }

  // No autorizado
  Swal.fire({
    icon:'warning',
    title:'Sin acceso',
    text:'No tienes permisos para abrir REGISTROS.'
  });
});
  
/* ================== CONTRATISTAS ================== */
let CONTR_DATA=[];
async function cargarContratistas(){
  try{
    const list=await apiGet('listContratistas');
    CONTR_DATA=Array.isArray(list)?list:[];
    pintarContratistas(CONTR_DATA);
    actualizarResumenContratistas(CONTR_DATA);
  }catch(e){
    CONTR_DATA=[];
    pintarContratistas(CONTR_DATA);
    actualizarResumenContratistas(CONTR_DATA);
    Swal.fire({icon:'error',title:'Error',text:e.message});
  }
}
function actualizarResumenContratistas(list){
  const box=document.getElementById('contr-count');
  if(!box) return;
  if(!list.length){ box.style.display='none'; box.textContent=''; return; }
  box.textContent=String(list.length);
  box.style.display='inline-block';
}
function pintarContratistas(list){
  const wrap=document.getElementById('contr-list');
  if(!wrap) return;
  wrap.innerHTML='';
  if(!list.length){
    wrap.innerHTML='<p class="muted center">No hay contratistas activos.</p>';
    return;
  }
  for(const c of list){
    const div=document.createElement('div');
    div.className='item-card';

    const header=document.createElement('div');
    header.className='item-header';

    const title=document.createElement('p');
    title.className='item-title';
    title.textContent= (c.nombre||'');

    header.appendChild(title);
    div.appendChild(header);

    const pDoc=document.createElement('p');
    pDoc.className='item-sub';
    pDoc.textContent='CC / NIT: '+(c.documento||'');
    div.appendChild(pDoc);

    const pSec=document.createElement('p');
    pSec.className='item-sub';
    pSec.textContent='SECRETARÍA: '+(c.secretaria||'');
    div.appendChild(pSec);

    const pSup=document.createElement('p');
    pSup.className='item-sub';
    pSup.textContent='SUPERVISOR: '+(c.supervisor||'');
    div.appendChild(pSup);

    const pContrato=document.createElement('p');
    pContrato.className='item-sub';
    pContrato.textContent='CONTRATO: '+(c.contrato||'')+' de: '+(c.fechaContrato||'');
    div.appendChild(pContrato);

    const pInicio=document.createElement('p');
    pInicio.className='item-sub';
    pInicio.textContent='FECHA INICIO: '+(c.fechaInicio||'');
    div.appendChild(pInicio);

    const pTermino=document.createElement('p');
    pTermino.className='item-sub';
    pTermino.textContent='FECHA TERMINO: '+(c.fechaTermino||'');
    div.appendChild(pTermino);

    const actionsRow=document.createElement('div');
    actionsRow.className='contr-actions';

    const leftGroup=document.createElement('div');
    leftGroup.className='left-group';

    const rightGroup=document.createElement('div');
    rightGroup.className='right-group';

    const btnDetalles=document.createElement('button');
    btnDetalles.textContent='MOSTRAR DETALLES';
    btnDetalles.addEventListener('click', ()=>{
      playSoundOnce(SOUNDS.login);
      mostrarDetallesContratista(c.documento); // se mantiene para la vista contratistas
    });

    const btnWhatsapp=document.createElement('button');
    btnWhatsapp.className='btn-icon';
    btnWhatsapp.innerHTML='<img src="https://res.cloudinary.com/dqqeavica/image/upload/v1759166341/WhatsApp_mljaqm.webp" alt="WhatsApp">';
    btnWhatsapp.setAttribute('aria-label','Abrir chat de WhatsApp');
    btnWhatsapp.addEventListener('click', ()=>{
      let tel=String(c.telefono||'').replace(/\D/g,'');
      if(!tel){ Swal.fire({icon:'info',title:'Sin teléfono'}); return; }
      if(!tel.startsWith('57')) tel='57'+tel;
      if(!/^57\d{10}$/.test(tel)){
        Swal.fire({icon:'warning',title:'Teléfono inválido'}); return;
      }
      window.open('https://wa.me/'+tel,'_blank');
    });

    const btnDrive=document.createElement('button');
    btnDrive.className='btn-icon';
    btnDrive.innerHTML='<img src="https://res.cloudinary.com/dqqeavica/image/upload/v1763997280/DRIVE_bycgsc.webp" alt="Drive">';
    btnDrive.setAttribute('aria-label','Abrir carpeta Drive');
    btnDrive.addEventListener('click', ()=>{
      if(c.carpetaContratista){
        window.open('https://drive.google.com/drive/folders/'+c.carpetaContratista,'_blank');
      }else{
        Swal.fire({icon:'info',title:'Sin carpeta',text:'No hay carpeta asociada.'});
      }
    });

    leftGroup.appendChild(btnDetalles);
    rightGroup.appendChild(btnWhatsapp);
    rightGroup.appendChild(btnDrive);
    actionsRow.appendChild(leftGroup);
    actionsRow.appendChild(rightGroup);

    div.appendChild(actionsRow);
    wrap.appendChild(div);
  }
}

document.getElementById('contr-filter').addEventListener('input',()=>{
  const qRaw = document.getElementById('contr-filter').value.trim().toLowerCase();
  const digits = qRaw.replace(/\D/g,'');
  const buscarDocumento = digits.length >= 5;

  const filtered = CONTR_DATA.filter(c=>{
    const base = [c.nombre,c.secretaria,c.supervisor,c.telefono,c.contrato]
      .some(v=>String(v||'').toLowerCase().includes(qRaw));

    if(base) return true;

    if(buscarDocumento){
      return String(c.documento||'').toLowerCase().includes(qRaw);
    }
    return false;
  });

  pintarContratistas(filtered);
  actualizarResumenContratistas(filtered);
});
document.getElementById('contr-volver').addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  showView('view-inicio');
});

/* ================== DETALLES CONTRATISTA (se mantiene) ================== */
async function mostrarDetallesContratista(documento){
  try{
    const d=await apiGet('detallesContratista',{documento});
    const body=document.getElementById('detalles-body');
    // NOTA: la vista detalles de contratista aún existe en tu HTML original,
    // pero en este archivo la eliminamos para “Orden de Pago” solamente.
    // Como aquí no existe #view-detalles en este index actualizado, mostramos en alerta.
    if(!d){
      Swal.fire({icon:'info',title:'No encontrado'});
      return;
    }
    const lines=[
      `NOMBRE: ${d.nombre||''}`,
      `CC / NIT: ${d.documento||''} de: ${d.expedida||''}`,
      `TELÉFONO: ${d.telefono||'SIN REGISTRO'}`,
      `CORREO: ${d.correo||'SIN REGISTRO'}`,
      `CUENTA: ${d.cuenta||''} ${d.tipoCuenta||''} ${d.banco||''}`,
      `EPS: ${d.eps||''}`,
      `AFP: ${d.pension||''}`,
      `ARL: ${d.arl||''}`,
      `SECRETARÍA: ${d.secretaria||''}`,
      `SUPERVISOR: ${d.supervisor||''}`,
      `CONTRATO: ${d.contrato||''} de: ${d.fechaContrato||''}`,
      `OBJETO: ${d.objeto||''}`,
      `FECHA DE INICIO: ${d.fechaInicio||''}`,
      `FECHA DE TERMINO: ${d.fechaTermino||''}`,
      `VALOR INICIAL: ${d.valor||''}`,
      `MRA: ${d.mra||''}`,
      `VALOR FINAL: ${d.valorFinal||''}`,
      `CDP: ${d.cdp||''}`,
      `RP: ${d.rp||''}`,
      `CDP ADICIÓN: ${d.cdpAdicion||''}`,
      `RP ADICIÓN: ${d.rpAdicion||''}`,
      `REGIMEN: ${d.regimen||''}`
    ];
    Swal.fire({
      icon:'info',
      title:'Detalles de Contratista',
      html: '<div style="text-align:left; font-weight:600; white-space:pre-line;">'+lines.join('\n')+'</div>'
    });
  }catch(e){
    Swal.fire({icon:'error',title:'Error',text:e.message});
  }
}

/* ================== ORDENES (Listado unificado) ================== */
let CUENTAS_DATA=[];
async function cargarCuentasPendientes(){
  try{
    const estado = (ORDEN_MODE === 'EMISION') ? 'PRE-ORDEN' : 'CERRADA';
    const list = await apiGet('listCuentasPorEstado', { estado });
    CUENTAS_DATA = Array.isArray(list) ? list : [];

    // Priorizar a OSCAR MAURICIO POLANIA GUERRA + ordenar por Fecha de Radicación (más antigua primero)
    if (ORDEN_MODE === 'CREACION' || ORDEN_MODE === 'EMISION'){
      const PRIORITARIO = 'OSCAR MAURICIO POLANIA GUERRA';

      // Fecha de radicación en formato DD/MM/YYYY o DD-MM-YYYY
      const parseFechaRad = (val) => {
        const s = String(val || '').trim();
        if (!s) return Infinity; // sin fecha -> al final del grupo
        const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (!m) return Infinity;
        return new Date(+m[3], +m[2]-1, +m[1]).getTime();
      };

      CUENTAS_DATA.sort((a, b) => {
        const aPrio = String(a.nombre || '').trim().toUpperCase() === PRIORITARIO ? 0 : 1;
        const bPrio = String(b.nombre || '').trim().toUpperCase() === PRIORITARIO ? 0 : 1;
        // 1) Oscar arriba
        if (aPrio !== bPrio) return aPrio - bPrio;
        // 2) Dentro del mismo grupo: fecha radicación ascendente (más antigua primero)
        return parseFechaRad(a.fechaRadicacion) - parseFechaRad(b.fechaRadicacion);
      });
    }

    configurarTituloOrdenes();
    pintarCuentas(CUENTAS_DATA);
    actualizarResumenCuentas(CUENTAS_DATA);
  }catch(e){
    CUENTAS_DATA=[];
    configurarTituloOrdenes();
    pintarCuentas(CUENTAS_DATA);
    actualizarResumenCuentas(CUENTAS_DATA);
    Swal.fire({icon:'error',title:'Error',text:e.message});
  }
}
function configurarTituloOrdenes(){
  const title = document.getElementById('revision-title');
  const caption = document.getElementById('cuentas-caption');
  if(!title || !caption) return;

  if(ORDEN_MODE === 'EMISION'){
    title.textContent = 'EMISIÓN - PRE-ORDENES PENDIENTES';
    caption.textContent = 'N° de Pre-Ordenes Pendientes';
  } else {
    title.textContent = 'CUENTAS PENDIENTES DE ORDEN PAGO';
    caption.textContent = 'N° de Cuentas Pendientes';
  }
}
function actualizarResumenCuentas(list){
  const box=document.getElementById('cuentas-count');
  if(!box) return;
  if(!list.length){ box.style.display='none'; box.textContent=''; return; }
  box.textContent=String(list.length);
  box.style.display='inline-block';
}

function pintarCuentas(list){
  const wrap=document.getElementById('cuentas-list');
  wrap.innerHTML='';
  if(!list.length){
    wrap.innerHTML='<p class="muted center">No hay cuentas pendientes.</p>';
    return;
  }

  for(const c of list){
    const div=document.createElement('div');
div.className='item-card';

// ✅ borde rojo si viene marcado desde backend (col DR)
const isPend = String(c.pendiente || '').trim().toUpperCase() === 'PENDIENTE';
if(isPend) div.classList.add('pending');

    const header=document.createElement('div');
    header.className='item-header orden-header';

    const title=document.createElement('p');
    title.className='item-title';
    title.textContent= (c.nombre||'');
    header.appendChild(title);

    // Ícono carpeta a BH (idCuenta) arriba a la derecha SIN desacomodar
    const folderBtn = document.createElement('button');
    folderBtn.className = 'btn-icon orden-folder';
    folderBtn.title = 'Abrir carpeta de CUENTA';
    folderBtn.setAttribute('aria-label','Abrir carpeta de CUENTA');
    folderBtn.innerHTML = '<img src="https://res.cloudinary.com/dqqeavica/image/upload/v1764111247/carpeta_drive_epbrhp.webp" alt="CUENTA">';
    folderBtn.addEventListener('click', ()=>{
      playSoundOnce(SOUNDS.login);
      const idCuenta = String(c.idCuenta || '').trim();
      if(idCuenta){
        window.open('https://drive.google.com/drive/folders/' + idCuenta, '_blank');
      }else{
        Swal.fire({icon:'info',title:'Sin carpeta',text:'Esta cuenta no tiene id de carpeta (BH) asociado.'});
      }
    });
    header.appendChild(folderBtn);


    // ✅ Botón GO/STOP (solo en vista CUENTAS PENDIENTES = modo CREACION)
if (ORDEN_MODE !== 'EMISION') {
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn-icon orden-toggle';
  toggleBtn.title = 'Marcar / Desmarcar PENDIENTE';
  toggleBtn.setAttribute('aria-label','Marcar o desmarcar PENDIENTE');

  const IMG_GO   = 'https://res.cloudinary.com/dqqeavica/image/upload/v1773101576/go_rsuqri.png';
  const IMG_STOP = 'https://res.cloudinary.com/dqqeavica/image/upload/v1773101575/stop_beqe4k.webp';

  // estado inicial según backend
  toggleBtn.innerHTML = '<img src="' + (isPend ? IMG_STOP : IMG_GO) + '" alt="PENDIENTE">';

  toggleBtn.addEventListener('click', async ()=>{
    playSoundOnce(SOUNDS.login);

    const nextPend = !div.classList.contains('pending');
    try{
      await setCuentaPendiente(c.documento, c.informe, nextPend);
      // refrescar para que vuelva a pintar borde rojo / imagen
      await cargarCuentasPendientes();
      showView('view-revision');
    }catch(e){
      Swal.fire({ icon:'error', title:'Error', text: e.message });
    }
  });

  header.appendChild(toggleBtn);
}

   // ✅ Botón AVISO DE VENCIMIENTO (solo en CREACION = CUENTAS PENDIENTES)
    if (ORDEN_MODE !== 'EMISION') {
      const avisoBtn = document.createElement('button');
      avisoBtn.className = 'btn-icon orden-aviso';
      avisoBtn.title = 'Enviar Aviso de Vencimiento';
      avisoBtn.setAttribute('aria-label','Enviar aviso de vencimiento');
      avisoBtn.innerHTML = '<img src="https://res.cloudinary.com/dqqeavica/image/upload/v1776287528/reloj_mnsqmb.png" alt="Aviso vencimiento">';

      avisoBtn.addEventListener('click', ()=>{
        playSoundOnce(SOUNDS.login);

        const grupoSupervisorId = String(c.contacto || '').trim();
        if(!grupoSupervisorId){
          Swal.fire({
            icon:'warning',
            title:'Sin grupo',
            text:'Este supervisor no tiene id de grupo (Columna F) asociado.'
          });
          return;
        }

        const supervisor   = c.supervisorCuenta || '';
        const informe      = c.informe || '';
        const radicacion   = c.fechaRadicacion || '';
        const contratista  = c.nombre || '';

        const mensaje =
          'Buen día *' + supervisor + '*\n' +
          '⚠ La cuenta *' + informe + '* con fecha de radicación *' + radicacion + '* del contratista *' + contratista + '* está próxima a vencer por cierre de mes ⚠\n\n' +
          '*Debes radicar sus 2 paquetes en la Oficina de contratación el día de hoy.*\n' +
          '> *Si ya están radicados*, solicita amablemente gestionar la radicación en nuestra oficina para poder realizar OP.\n\n' +
          'Cordialmente,\n\n' +
          '*Equipo de Contabilidad*\n' +
          '> Alcaldía de Flandes';

        sendBuilderbotMessage(grupoSupervisorId, mensaje);

        Swal.fire({
          icon: 'success',
          title: 'Supervisor Notificado',
          timer: 2000,
          showConfirmButton: false
        });
      });

      header.appendChild(avisoBtn);
    }
    
    const pDoc=document.createElement('p');
    pDoc.className='item-sub';
    pDoc.textContent='CC / NIT: '+(c.documento||'');

    const pContrato=document.createElement('p');
    pContrato.className='item-sub';
    pContrato.textContent='CONTRATO: '+(c.contrato||'');

    const pInf=document.createElement('p');
    pInf.className='item-sub';
    pInf.textContent='INFORME: '+(c.informe||'')+' de: '+(c.totalInformes||'');

    const facturaVal = String(c.facturaElectronica||'').trim();
    const pFactura=document.createElement('p');
    pFactura.className='item-sub';
    pFactura.textContent='FACTURA ELECTRÓNICA N°: '+(facturaVal ? facturaVal : 'N/A');

    const pSup=document.createElement('p');
    pSup.className='item-sub';
    pSup.textContent='SUPERVISOR: '+(c.supervisorCuenta||'');

    // ✅ NUEVO: FECHA DE RADICACIÓN (col F) rojo + latido
    const pRad=document.createElement('p');
    pRad.className='item-sub pulse-red';
    pRad.textContent='FECHA DE RADICACIÓN: '+(c.fechaRadicacion||'');

    // ✅ NUEVO: Input requerido N° ORDEN (6 dígitos exactos)
     let labelOrden = null;
    let inputOrden = null;

    if (ORDEN_MODE !== 'EMISION') {
      labelOrden = document.createElement('label');
      labelOrden.textContent = 'N° ORDEN DE PAGO (6 dígitos)';

      inputOrden = document.createElement('input');
      inputOrden.className = 'op-input';
      inputOrden.type = 'text';
      inputOrden.inputMode = 'numeric';
      inputOrden.autocomplete = 'off';
      inputOrden.placeholder = '000000';
      inputOrden.maxLength = 6;
      inputOrden.value = String(c.ordenPago || '');

      inputOrden.addEventListener('input', ()=>{
        // solo dígitos
        let v = String(inputOrden.value || '').replace(/\D/g,'').slice(0,6);
        inputOrden.value = v;
        c.ordenPago = v; // guardar en memoria (para el flujo)
      });
    }

    const btnRow=document.createElement('div');
    btnRow.className='btn-row';

    const btnAccion=document.createElement('button');
    btnAccion.textContent = (ORDEN_MODE === 'EMISION') ? 'EMITIR' : 'ORDEN CREADA';
btnAccion.addEventListener('click', async ()=>{
      playSoundOnce(SOUNDS.login);

      // ✅ SOLO pedir N° ORDEN en modo CREACIÓN (CERRADA)
      if (ORDEN_MODE !== 'EMISION') {
        const op = String(c.ordenPago || '').trim();
        if(!/^\d{6}$/.test(op)){
          Swal.fire({
            icon:'warning',
            title:'N° ORDEN DE PAGO requerido',
            text:'Debes ingresar exactamente 6 dígitos (ej: 000118).'
          });
          if (inputOrden) inputOrden.focus();
          return;
        }
      }

      if(ORDEN_MODE === 'EMISION'){
        await emitirOrdenPagoFlow(c);
      }else{
        await crearPreOrdenFlow(c);
      }
    });
    btnRow.appendChild(btnAccion);

    div.appendChild(header);
    div.appendChild(pDoc);
    div.appendChild(pContrato);
    div.appendChild(pInf);
    div.appendChild(pFactura);
    div.appendChild(pSup);

     // ✅ justo después de SUPERVISOR:
    div.appendChild(pRad);

    // ✅ mostrar N° ORDEN solo en CREACIÓN
    if (ORDEN_MODE !== 'EMISION') {
      div.appendChild(labelOrden);
      div.appendChild(inputOrden);
    }

    div.appendChild(btnRow);
    wrap.appendChild(div);
  }
}
  
document.getElementById('cuentas-filter').addEventListener('input',()=>{
  const qRaw = document.getElementById('cuentas-filter').value.trim().toLowerCase();
  const digits = qRaw.replace(/\D/g,'');
  const buscarDocumento = digits.length >= 5;

  const filtered = CUENTAS_DATA.filter(c=>{
    const base = [c.nombre,c.informe,c.totalInformes,c.contrato,c.facturaElectronica,c.supervisorCuenta]
      .some(v=>String(v||'').toLowerCase().includes(qRaw));

    if(base) return true;

    if(buscarDocumento){
      return String(c.documento||'').toLowerCase().includes(qRaw);
    }
    return false;
  });

  pintarCuentas(filtered);
  actualizarResumenCuentas(filtered);
});
document.getElementById('revision-volver').addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  showView('view-inicio');
});

/* ================== FLOW 1: CREAR PRE-ORDEN ================== */
async function crearPreOrdenFlow(c){
  const nombre = c.nombre || '';
  const informe = c.informe || '';

  // ✅ N° orden (6 dígitos) -> mostrar con prefijo 2026 en resumen
  const orden6 = String(c.ordenPago || '').trim();
  if(!/^\d{6}$/.test(orden6)){
    Swal.fire({
      icon:'warning',
      title:'N° ORDEN DE PAGO requerido',
      text:'Debes ingresar exactamente 6 dígitos (ej: 000118).'
    });
    return;
  }
const ordenFull = '2026' + orden6;

  const rs = await Swal.fire({
    icon:'success',
    title:`Cuenta N° ${informe} de ${nombre}`,
    html:
  `<div style="text-align:center; font-weight:900; line-height:1.4">`+
  `<div style="font-size:1.05rem; margin-top:6px;"><b>N° ORDEN DE PAGO</b></div>`+
  `<div style="color:#06402B; font-size:1.25rem; letter-spacing:2px;">${ordenFull}</div>`+
  `</div>`,
    showCancelButton:true,
    confirmButtonText:'GUARDAR ORDEN',
    cancelButtonText:'Cancelar'
  });

  if(!rs.isConfirmed) return;

  try{
    await apiPost('crearPreOrden', {
      documento: c.documento,
      informe: c.informe,
      responsable: currentUser?.profesional || '',
      ordenPago: ordenFull // ✅ NUEVO: se envía al backend
    });

    Swal.fire({icon:'success',title:'Pre-Orden creada',timer:1600,showConfirmButton:false});

    await cargarCuentasPendientes();
    showView('view-revision');
  }catch(e){
    Swal.fire({icon:'error',title:'Error',text:e.message});
  }
}

/* ================== FLOW 2: EMITIR ORDEN DE PAGO ================== */
async function emitirOrdenPagoFlow(c){
  const documento = c.documento;
  const nombre = c.nombre || '';
  const informe = c.informe || '';

  const telContratistaRaw = c.telefono || '';
  const telContratista = normalizeContratistaNumber(telContratistaRaw);

  const TESORERIA_GROUP_ID = 'KQyQKkptgOI56Qbn6gsJUh'; /*Grupo de tesorería*/

  const rs = await Swal.fire({
    icon:'success',
    title:`Pre-Orden N° ${informe} de ${nombre}`,
    text:'¿Deseas EMITIR la Orden de Pago?',
    showCancelButton:true,
    confirmButtonText:'EMITIR',
    cancelButtonText:'Cancelar'
  });

  function msgOrdenPagoContratista(){
    return (
      '> Estado 4️⃣\n' +
      'Estimado(a) *'+nombre+'*\n\n' +
      '¡Ha sido emitada la orden de pago de tu *Cuenta N° '+informe+'*\n' +
      'El equipo de *Tesoría* en sus tiempos, revisará para generar el Egreso y Pago de tus honorarios.\n\n' +
      'Cordialmente,\n\n*Equipo de Contabilidad*\n> Alcaldía de Flandes'
    );
  }

  function msgOrdenPagoTesoreria(){
    return (
      'Estimado Equipo de Tesorería\n\n' +
      'Se ha generado la *Orden de Pago* de la *Cuenta N° '+informe+'* del contratista *'+nombre+'*\n\n' +
      'Por favor revisar para generar Egreso.\n\n' +
      'Cordialmente,\n\n*Equipo de Contabilidad*'
    );
  }

  if(!rs.isConfirmed) return;

  try{
    // Backend SOLO actualiza estados (CUENTAS BJ -> ORDEN DE PAGO y ORDENES F -> EMITIDO)
    await apiPost('emitirOrdenPagoV2', {
      documento,
      informe,
      responsable: currentUser?.profesional || ''
    });

    // Envío WhatsApp SOLO desde aquí (como lo querías)
    if(telContratista){
      sendBuilderbotMessage(telContratista, msgOrdenPagoContratista());
    }
    sendBuilderbotMessage(TESORERIA_GROUP_ID, msgOrdenPagoTesoreria());

    Swal.fire({icon:'success',title:'Orden de Pago Emitida',timer:1800,showConfirmButton:false});
    await cargarCuentasPendientes();
    showView('view-revision');
  }catch(e){
    Swal.fire({icon:'error',title:'Error',text:e.message});
  }
}

/* ================== REVISAR CUENTA (Detalle) ================== */

function resetSeccionesRevision(){
  const parts = [
    { sec:'sec-contrato',   btn:'btn-toggle-contrato',  label:'Ver Información del Contrato' },
    { sec:'sec-informe',    btn:'btn-toggle-informe',   label:'Ver Relación de Informe y Pago' },
    { sec:'sec-planilla',   btn:'btn-toggle-planilla',  label:'Ver Relación de Planilla' },
    { sec:'sec-planilla2',  btn:'btn-toggle-planilla2', label:'Ver Relación de Planilla Anexa' },
  ];
  parts.forEach(({sec, btn, label})=>{
    const s = document.getElementById(sec);
    const b = document.getElementById(btn);
    if (s) s.classList.add('hidden');
    if (b) b.textContent = label;
  });
}

let REV_CUENTA=null;
async function abrirRevisionCuenta(documento){
  try{
    const data=await apiGet('revisarCuentaData',{documento});
    if(!data){
      Swal.fire({icon:'info',title:'No encontrado'}); return;
    }
    REV_CUENTA=data;
    resetSeccionesRevision();
    renderRevisionCuenta();
    showView('view-revisar-cuenta');
  }catch(e){
    Swal.fire({icon:'error',title:'Error',text:e.message});
  }
}
function renderRevisionCuenta(){
  const c=REV_CUENTA?.contratista;
  const cu=REV_CUENTA?.cuenta;
  const rcTitle=document.getElementById('rc-title');
  const rcBody=document.getElementById('rc-body');
  rcTitle.textContent='REVISIÓN DE CUENTA N° '+(cu?.informe||'')+' de '+(c?.nombre||'');
  rcBody.innerHTML='';
  const baseInfo=[
    `<b>DOCUMENTO:</b> ${c?.documento||''}`,
    `<b>SECRETARÍA:</b> ${c?.secretaria||''}`,
    `<b>SUPERVISOR:</b> ${c?.supervisor||''}`
  ];
  rcBody.innerHTML=baseInfo.map(x=>`<p>${x}</p>`).join('');

  const sContrato=document.getElementById('sec-contrato');
  sContrato.innerHTML=[
    `<b>CONTRATO N°:</b> ${c?.contrato||''}`,
    `<b>FECHA DE CONTRATO:</b> ${c?.fechaContrato||''}`,
    `<b>FECHA DE INICIO:</b> ${c?.fechaInicio||''}`,
    `<b>FECHA DE TERMINO:</b> ${c?.fechaTermino||''}`,
    `<b>VALOR INICIAL:</b> ${c?.valor || '-'}`,
    `<b>MRA:</b> ${c?.mra||''}`,
    `<b>VALOR FINAL:</b> ${c?.valorFinal||''}`,
    `<b>CDP:</b> ${c?.cdp||''}`,
    `<b>RP:</b> ${c?.rp||''}`,
    `<b>CDP ADICIÓN:</b> ${c?.cdpAdicion||''}`,
    `<b>RP ADICIÓN:</b> ${c?.rpAdicion||''}`,
    `<b>SECRETARÍA:</b> ${c?.secretaria||''}`,
    `<b>SUPERVISOR:</b> ${c?.supervisor||''}`,
  ].map(x=>`<p>${x}</p>`).join('');

  const sInforme=document.getElementById('sec-informe');
  sInforme.innerHTML=[
    `<h4 style="margin:4px 0;color:var(--primary)">RELACIÓN DE INFORME</h4>`,
    `<p><b>FECHA DE RADICACIÓN:</b> ${cu?.fechaRadicacion||''}</p>`,
    `<p><b>INFORME:</b> ${cu?.informe||''} de ${cu?.totalInformes||''}</p>`,
    `<p><b>INICIO DE PERIODO RATIFICADO:</b> ${cu?.inicioRatificar||''}</p>`,
    `<p><b>FIN DE PERIODO RATIFICADO:</b> ${cu?.finRatificar||''}</p>`,
    `<h4 style="margin:14px 0 4px;color:var(--primary)">RELACIÓN DE PAGO</h4>`,
    `<p><b>SALDO ACTUAL:</b> ${cu?.saldoActual||''}</p>`,
    `<p><b>VALOR COBRADO:</b> ${cu?.menos||''}</p>`,
    `<p><b>NUEVO SALDO:</b> ${cu?.nuevoSaldo||''}</p>`
  ].join('');

  const sPlanilla=document.getElementById('sec-planilla');
  sPlanilla.innerHTML=[
    `<h4 style="margin:4px 0;color:var(--primary)">RELACIÓN DE PLANILLA</h4>`,
    `<p><b>PLANILLA N°:</b> ${cu?.planilla||''} de ${cu?.mesPlanilla||''}</p>`,
    `<p><b>BASE DE COTIZACIÓN:</b> ${cu?.base||''}</p>`,
    `<p><b>APORTES A SALUD:</b> ${cu?.salud||''}</p>`,
    `<p><b>APORTES A PENSIÓN:</b> ${cu?.fondo||''}</p>`,
    `<p><b>APORTES A ARL:</b> ${cu?.riesgos||''}</p>`,
    `<p><b>APORTES FPS:</b> ${cu?.solidario||''} ${cu?.aporte||''}</p>`
  ].join('');

  const sPlanilla2=document.getElementById('sec-planilla2');
  sPlanilla2.innerHTML=[
    `<h4 style="margin:4px 0;color:var(--primary)">RELACIÓN DE PLANILLA ANEXA</h4>`,
    `<p><b>PLANILLA ANEXA N°:</b> ${cu?.planilla2||''} de ${cu?.mesPlanilla2||''}</p>`,
    `<p><b>BASE DE COTIZACIÓN:</b> ${cu?.base2||''}</p>`,
    `<p><b>APORTES A SALUD:</b> ${cu?.salud2||''}</p>`,
    `<p><b>APORTES A PENSIÓN:</b> ${cu?.fondo2||''}</p>`,
    `<p><b>APORTES A ARL:</b> ${cu?.riesgos2||''}</p>`,
    `<p><b>APORTES FPS:</b> ${cu?.solidario2||''} ${cu?.aporte2||''}</p>`
  ].join('');

  const cuentaBtn = document.getElementById('btn-abrir-carpeta-cuenta');
  if (cu?.informe && c?.carpetaContratista){
    cuentaBtn.classList.remove('hidden');
    cuentaBtn.dataset.parent  = c.carpetaContratista;
    cuentaBtn.dataset.informe = String(cu.informe).trim();
    if (cu?.idCuenta){
      cuentaBtn.dataset.subId = String(cu.idCuenta).trim();
    } else {
      delete cuentaBtn.dataset.subId;
    }
  } else {
    cuentaBtn.classList.add('hidden');
    delete cuentaBtn.dataset.parent;
    delete cuentaBtn.dataset.informe;
    delete cuentaBtn.dataset.subId;
  }
}

document.getElementById('rc-volver').addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  resetSeccionesRevision();
  showView('view-revision');
});

// Abrir carpeta CUENTA en Drive
const btnAbrirCarpetaCuenta = document.getElementById('btn-abrir-carpeta-cuenta');
btnAbrirCarpetaCuenta.addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.login);

  const subId = btnAbrirCarpetaCuenta.dataset.subId || '';
  const parentId = btnAbrirCarpetaCuenta.dataset.parent || REV_CUENTA?.contratista?.carpetaContratista || '';

  if (subId){
    window.open('https://drive.google.com/drive/folders/' + subId, '_blank');
    return;
  }
  if (parentId){
    Swal.fire({ icon:'info', title:'Falta id de CUENTA', text:'Se abrirá la carpeta del contratista.' });
    window.open('https://drive.google.com/drive/folders/' + parentId, '_blank');
  } else {
    Swal.fire({ icon:'info', title:'Sin carpeta', text:'Este contratista no tiene "carpetaContratista" asociada.' });
  }
});

function initRevisionToggleSections(){
  const defs = [
    ['btn-toggle-contrato','sec-contrato','Ver Información del Contrato','Ocultar Información del Contrato'],
    ['btn-toggle-informe','sec-informe','Ver Relación de Informe y Pago','Ocultar Relación de Informe y Pago'],
    ['btn-toggle-planilla','sec-planilla','Ver Relación de Planilla','Ocultar Relación de Planilla'],
    ['btn-toggle-planilla2','sec-planilla2','Ver Relación de Planilla Anexa','Ocultar Relación de Planilla Anexa']
  ];
  defs.forEach(([btnId,secId,showTxt,hideTxt])=>{
    const btn = document.getElementById(btnId);
    const sec = document.getElementById(secId);
    if(!btn || !sec) return;
    if(btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click',()=>{
      const visible = !sec.classList.contains('hidden');
      if(visible){
        sec.classList.add('hidden');
        btn.textContent = showTxt;
      }else{
        sec.classList.remove('hidden');
        btn.textContent = hideTxt;
      }
    });
  });
}
initRevisionToggleSections();

/* ================== REQUERIMIENTOS ================== */
let REQ_DATA=[];
async function cargarRequerimientosBase(){
  try{
    const list=await apiGet('listContratistas');
    REQ_DATA=Array.isArray(list)?list:[];
    pintarRequerimientos(REQ_DATA);
    actualizarResumenReq(REQ_DATA);
  }catch(e){
    REQ_DATA=[];
    pintarRequerimientos(REQ_DATA);
    actualizarResumenReq(REQ_DATA);
    Swal.fire({icon:'error',title:'Error',text:e.message});
  }
}
function actualizarResumenReq(list){
  const box=document.getElementById('req-count');
  if(!box) return;
  if(!list.length){ box.style.display='none'; box.textContent=''; return; }
  box.textContent=String(list.length);
  box.style.display='inline-block';
}
function pintarRequerimientos(list){
  const wrap=document.getElementById('req-list');
  wrap.innerHTML='';
  if(!list.length){
    wrap.innerHTML='<p class="muted center">No hay contratistas.</p>';
    return;
  }
  for(const c of list){
    const div=document.createElement('div');
    div.className='item-card';

    const header=document.createElement('div');
    header.className='item-header';

    const title=document.createElement('p');
    title.className='item-title';
    title.textContent='NOMBRE: '+(c.nombre||'');
    header.appendChild(title);
    div.appendChild(header);

    const pSup=document.createElement('p');
    pSup.className='item-sub';
    pSup.textContent='SUPERVISOR: '+(c.supervisor||'');
    div.appendChild(pSup);

    const pSec=document.createElement('p');
    pSec.className='item-sub';
    pSec.textContent='SECRETARÍA: '+(c.secretaria||'');
    div.appendChild(pSec);

    const btnRow=document.createElement('div');
    btnRow.className='btn-row';

    const btnRedact=document.createElement('button');
    btnRedact.textContent='REDACTAR';
    btnRedact.addEventListener('click', ()=>{
      playSoundOnce(SOUNDS.login);
      abrirModalRequerimiento(c);
    });

    btnRow.appendChild(btnRedact);
    div.appendChild(btnRow);

    wrap.appendChild(div);
  }
}
  
document.getElementById('req-filter').addEventListener('input',()=>{
  const q=document.getElementById('req-filter').value.trim().toLowerCase();
  const filtered=REQ_DATA.filter(c=>{
    return [c.nombre,c.documento,c.secretaria,c.supervisor,c.telefono]
      .some(v=>String(v||'').toLowerCase().includes(q));
  });
  pintarRequerimientos(filtered);
  actualizarResumenReq(filtered);
});
document.getElementById('req-volver').addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  showView('view-inicio');
});

/* ================== MODAL REQUERIMIENTO ================== */
let MODAL_TARGET=null;
function abrirModalRequerimiento(c){
  MODAL_TARGET=c;
  document.getElementById('modal-req-text').value='';
  document.getElementById('modal-requerimiento').classList.remove('hidden');
}
document.getElementById('modal-req-cancelar').addEventListener('click',()=>{
  document.getElementById('modal-requerimiento').classList.add('hidden');
});
document.getElementById('modal-req-enviar').addEventListener('click',()=>{
  const txt=(document.getElementById('modal-req-text').value||'').trim();
  if(!MODAL_TARGET){ return; }
  if(!txt){
    Swal.fire({icon:'warning',title:'Texto requerido'}); return;
  }

  const supervisor = (MODAL_TARGET.supervisor || '').trim();
  const grupoSupervisorId = String(MODAL_TARGET.contacto || '').trim();
  const nombre = (MODAL_TARGET?.nombre || '').trim();
  const requerimiento = txt;

 function msgRequerimiento(){
    return (
      '*🛑 CUENTA DETENIDA EN CONTABILIDAD 🛑*\n' +
      'Estimado(a) *' + supervisor + '*\n\n' +
      'Tenemos el siguiente requerimiento con respecto al contratista *' + nombre + ':*\n' +
      '*' + requerimiento + '*\n\n' +
      'Cordialmente,\n\n*Equipo de Contabilidad*'
    );
  }

  if (grupoSupervisorId){
    sendBuilderbotMessage(grupoSupervisorId, msgRequerimiento());
  } else {
    Swal.fire({ icon:'warning', title:'Sin grupo', text:'Este supervisor no tiene id de grupo (Columna F) asociado.' });
    return;
  }

  document.getElementById('modal-requerimiento').classList.add('hidden');
  Swal.fire({icon:'success',title:'Requerimiento enviado',timer:1800,showConfirmButton:false});
});
  
/* ================== COMUNICADOS ================== */
document.getElementById('comunicado-enviar').addEventListener('click',async()=>{
  const txt=(document.getElementById('comunicado-text').value||'').trim();
  if(!txt){ Swal.fire({icon:'warning',title:'Texto requerido'}); return; }
  try{
    await apiPost('guardarComunicado',{
      profesional: currentUser?.profesional || '',
      noticia: txt
    });
    Swal.fire({icon:'success',title:'COMUNICADO CARGADO CON ÉXITO',timer:4000,showConfirmButton:false});
    document.getElementById('comunicado-text').value='';
    renderInicio();
    showView('view-inicio');
  }catch(e){
    Swal.fire({icon:'error',title:'Error',text:e.message});
  }
});
document.getElementById('comunicado-volver').addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  showView('view-inicio');
});

/* ================== SOPORTE ================== */
document.getElementById('soporte-enviar').addEventListener('click',async()=>{
  const txt=(document.getElementById('soporte-text').value||'').trim();
  if(!txt){ Swal.fire({icon:'warning',title:'Texto requerido'}); return; }
  try{
    await apiPost('guardarSoporte',{
      profesional: currentUser?.profesional || '',
      soporte: txt,
      celular: currentUser?.celular || ''
    });
    Swal.fire({icon:'success',title:'SOLICITUD CARGADA CON ÉXITO',timer:4000,showConfirmButton:false});
    document.getElementById('soporte-text').value='';
    renderInicio();
    showView('view-inicio');
  }catch(e){
    Swal.fire({icon:'error',title:'Error',text:e.message});
  }
});
document.getElementById('soporte-volver').addEventListener('click', ()=>{
  playSoundOnce(SOUNDS.back);
  showView('view-inicio');
});

    /* ================== GO / STOP ================== */
async function setCuentaPendiente(documento, informe, pendiente){
  return apiPost('setCuentaPendiente', { documento, informe, pendiente: !!pendiente });
}

/* ================== PWA AVANZADO (igual) ================== */
let deferredPrompt = null;
let __installStartShown = false;
let __installSuccessShown = false;

function isStandalone(){
  const dmStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const dmInstalled  = window.matchMedia('(display-mode: installed)').matches;
  const iosStandalone = (window.navigator.standalone === true);
  return dmStandalone || dmInstalled || iosStandalone;
}
function isIOS(){
  return /(iphone|ipad|ipod)/i.test(navigator.userAgent || '');
}
function isMarkedInstalled(){
  try{ return localStorage.getItem('pwaInstalledFlag') === '1'; }catch(_){ return false; }
}
function markInstalled(){
  try{ localStorage.setItem('pwaInstalledFlag', '1'); }catch(_){}
}
function clearInstalledMark(){
  try{ localStorage.removeItem('pwaInstalledFlag'); }catch(_){}
}
async function detectInstalled(){
  if (isStandalone()) return true;
  if (typeof navigator.getInstalledRelatedApps === 'function'){
    try{
      const apps = await navigator.getInstalledRelatedApps();
      const found = apps.some(a =>
        a.platform === 'webapp' &&
        typeof a.url === 'string' &&
        /manifest\.webmanifest$/.test(a.url)
      );
      if (found){
        markInstalled();
        return true;
      } else {
        clearInstalledMark();
      }
    }catch(_){}
  }
  return isMarkedInstalled();
}
function updateInstallButtonsVisibility(){
  const btn1 = document.getElementById('btn-instalar');
  const canPrompt = !!deferredPrompt;
  const installed = isMarkedInstalled() || isStandalone();
  const shouldShow = !installed && (canPrompt || isIOS());
  if(btn1) btn1.style.display = shouldShow ? '' : 'none';
}

window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  updateInstallButtonsVisibility();
});

window.addEventListener('appinstalled', ()=>{
  markInstalled();
  deferredPrompt = null;
  updateInstallButtonsVisibility();
});

document.getElementById('btn-instalar').addEventListener('click', async ()=>{
  if(isIOS()){
    Swal.fire({
      icon:'info',
      title: '¡Para Instalar en tu Iphone!',
      html: `
        <div style="text-align:center; margin-top:8px;">
          <img
            src="https://res.cloudinary.com/dqqeavica/image/upload/v1765745210/instalacion_ios_ysbhnd.gif"
            alt="Instalación de IOS"
            style="width:180px; max-width:70vw; height:auto; display:block; margin:0 auto 12px;"
          >
          <div style="margin-top:10px;">
            <b>1.</b> Toca Compartir.<br><b>2.</b> Elige "Agregar a pantalla de inicio".<br><b>3.</b> Confirma "Agregar".
          </div>
        </div>
      `,
    });
    return;
  }
  if(!deferredPrompt){
    Swal.fire({icon:'info',title:'Instalación no disponible todavía'});
    return;
  }

  const dp = deferredPrompt;
  dp.prompt();
  const choice = await dp.userChoice;
  deferredPrompt = null;

  if (choice.outcome === 'accepted'){
    markInstalled();
    __installStartShown = true;
    Swal.fire({
      icon: 'success',
      title: '¡App instalándose!',
      html: `
        <div style="text-align:center; margin-top:8px;">
          <img
            src="https://res.cloudinary.com/dqqeavica/image/upload/v1765740540/instalacion_lydtcl.gif"
            alt="Instalando app"
            style="width:180px; max-width:70vw; height:auto; display:block; margin:0 auto 12px;"
          >
          <div>Debes esperar unos segundos mientras el sistema instala la App.</div>
          <div style="margin-top:10px;">
            <b>Al desaparecer este aviso, puedes salir de esta vista. La App aparecerá en la pantalla principal de este dispositivo.</b>
          </div>
        </div>
      `,
      timer: 12000,
      showConfirmButton: false
    });
  } else {
    Swal.fire({icon:'info',title:'Instalación cancelada'});
  }

  updateInstallButtonsVisibility();
});

async function initPWAVista(){
  const installed = await detectInstalled();
  if (installed){
    showView('view-login');
  } else {
    showView('view-instalar');
    updateInstallButtonsVisibility();
  }
}
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}
window.addEventListener('load', initPWAVista);

/* ================== AUTO-ACTUALIZACIÓN (version.json) ================== */
let __APP_VERSION_LOADED = '';
let __versionCheckInFlight = false;

async function checkAppVersion(){
  if(__versionCheckInFlight) return;
  __versionCheckInFlight = true;
  try{
    const url = 'version.json?t=' + Date.now();
    const r = await fetch(url, { cache: 'no-store' });
    if(!r.ok) return;
    const j = await r.json();
    const serverVersion = String(j.version || '').trim();
    if(!serverVersion) return;

    // Primera lectura: guardar la versión actual y pintarla en login
    if(!__APP_VERSION_LOADED){
      __APP_VERSION_LOADED = serverVersion;
      const el = document.getElementById('app-version');
      if(el) el.textContent = 'Versión ' + serverVersion;
      return;
    }

    // Lecturas posteriores: si cambió, recargar silenciosamente
    if(serverVersion !== __APP_VERSION_LOADED){
      try{
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }catch(_){}
      location.reload();
    }
  }catch(_){
    /* silencio: sin red no hay actualización */
  }finally{
    __versionCheckInFlight = false;
  }
}

// Recarga automática cuando el SW nuevo toma control (solo una vez por sesión de página)
if('serviceWorker' in navigator){
  let __reloadingFromSW = false;
  navigator.serviceWorker.addEventListener('controllerchange', ()=>{
    if(__reloadingFromSW) return;
    // Evitar loop: solo recargar si NO veníamos de una recarga reciente
    const lastReload = Number(sessionStorage.getItem('__swReloadTs') || 0);
    const now = Date.now();
    if(now - lastReload < 10000) return; // si recargamos hace menos de 10s, no recargar otra vez
    __reloadingFromSW = true;
    sessionStorage.setItem('__swReloadTs', String(now));
    location.reload();
  });
}

// Chequeo al cargar la página
window.addEventListener('load', ()=>{ checkAppVersion(); });

// Chequeo cada vez que la pestaña/PWA vuelve a estar visible (máx 1 vez cada 30s)
let __lastVersionCheck = Date.now();
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden) return;
  const now = Date.now();
  if(now - __lastVersionCheck < 30000) return;
  __lastVersionCheck = now;
  checkAppVersion();
});
