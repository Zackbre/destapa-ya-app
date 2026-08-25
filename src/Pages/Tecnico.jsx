import {
  useEffect,
  useState
} from 'react'

import { supabase } from '../supabase'

import EjecucionServicio from './EjecucionServicio.jsx'

import './Tecnico.css'
import EnviarReporteCliente from './EnviarReporteCliente.jsx' 


function Tecnico({
  perfil,
  onLogout
}) {

  const hoy =
    new Date()
      .toISOString()
      .split('T')[0]


  const [
    fechaSeleccionada,
    setFechaSeleccionada
  ] = useState(hoy)


  const [
    citas,
    setCitas
  ] = useState([])


  const [
    cargando,
    setCargando
  ] = useState(true)


  const [
    mensaje,
    setMensaje
  ] = useState('')


  const [
    procesandoId,
    setProcesandoId
  ] = useState(null)


  const [
    servicioEnEjecucion,
    setServicioEnEjecucion
  ] = useState(null)


  // ==========================================
  // CARGAR AL CAMBIAR FECHA
  // ==========================================

  useEffect(() => {

    cargarServicios()

  }, [fechaSeleccionada])


  // ==========================================
  // CARGAR SERVICIOS DEL TECNICO
  // ==========================================

  async function cargarServicios() {

    setCargando(true)
    setMensaje('')


    const {
      data,
      error
    } =
      await supabase
        .from('citas')
        .select(`
          id,
          cliente_id,
          direccion_id,
          tipo_servicio_id,
          vehiculo_id,
          fecha,
          hora_estimada,
          descripcion_problema,
          observaciones,
          estado,
          fecha_en_camino,
          fecha_llegada,
          fecha_inicio,
          fecha_conclusion,

          clientes (
            id,
            nombre,
            telefono,
            whatsapp
          ),

          direcciones_cliente (
            id,
            nombre_ubicacion,
            calle,
            numero_exterior,
            numero_interior,
            colonia,
            municipio,
            estado,
            codigo_postal,
            referencias,
            latitud,
            longitud
          ),

          tipos_servicio (
            id,
            nombre
          ),

          vehiculos (
            id,
            nombre_unidad,
            placas
          ),

          citas_tecnicos!inner (
            tecnico_id
          )
        `)
        .eq(
          'citas_tecnicos.tecnico_id',
          perfil.id
        )
        .eq(
          'fecha',
          fechaSeleccionada
        )
        .order(
          'hora_estimada',
          {
            ascending: true
          }
        )


    if (error) {

      console.error(
        'Error cargando servicios:',
        error
      )


      setMensaje(
        'No fue posible cargar tus servicios: ' +
        error.message
      )


      setCitas([])
      setCargando(false)

      return
    }


    setCitas(
      data || []
    )

    setCargando(false)
  }


  // ==========================================
  // CERRAR SESION
  // ==========================================

  async function cerrarSesion() {

    await supabase.auth.signOut()

    onLogout()
  }


  // ==========================================
  // FORMATEAR HORA
  // ==========================================

  function formatearHora(
    hora
  ) {

    if (!hora) {
      return ''
    }


    const partes =
      hora.split(':')


    let horas =
      Number(
        partes[0]
      )


    const minutos =
      partes[1]


    const periodo =
      horas >= 12
        ? 'PM'
        : 'AM'


    horas =
      horas % 12 ||
      12


    return `${horas}:${minutos} ${periodo}`
  }


  // ==========================================
  // FORMATEAR FECHA
  // ==========================================

  function formatearFecha(
    fecha
  ) {

    if (!fecha) {
      return ''
    }


    const objetoFecha =
      new Date(
        `${fecha}T12:00:00`
      )


    return new Intl.DateTimeFormat(
      'es-MX',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }
    ).format(
      objetoFecha
    )
  }


  // ==========================================
  // DIRECCION
  // ==========================================

  function obtenerDireccion(
    cita
  ) {

    const direccion =
      cita
        ?.direcciones_cliente


    if (!direccion) {

      return 'Sin dirección'
    }


    return [

      direccion.nombre_ubicacion,

      direccion.calle,

      direccion.numero_exterior
        ? `#${direccion.numero_exterior}`
        : '',

      direccion.numero_interior
        ? `Int. ${direccion.numero_interior}`
        : '',

      direccion.colonia,

      direccion.municipio

    ]
      .filter(Boolean)
      .join(', ')
  }


  // ==========================================
  // ABRIR MAPA
  // ==========================================

  function abrirMapa(
    cita
  ) {

    const direccion =
      cita
        ?.direcciones_cliente


    if (
      direccion?.latitud &&
      direccion?.longitud
    ) {

      const url =
        `https://www.google.com/maps/search/?api=1&query=` +
        `${direccion.latitud},${direccion.longitud}`


      window.open(
        url,
        '_blank'
      )

      return
    }


    const textoDireccion =
      obtenerDireccion(
        cita
      )


    const url =
      `https://www.google.com/maps/search/?api=1&query=` +
      encodeURIComponent(
        textoDireccion
      )


    window.open(
      url,
      '_blank'
    )
  }


  // ==========================================
  // LLAMAR CLIENTE
  // ==========================================

  function llamarCliente(
    cita
  ) {

    const telefono =
      cita
        ?.clientes
        ?.telefono


    if (!telefono) {
      return
    }


    window.location.href =
      `tel:${telefono}`
  }


  // ==========================================
  // WHATSAPP
  // ==========================================

  function abrirWhatsApp(
    cita
  ) {

    const telefono =
      cita
        ?.clientes
        ?.whatsapp ||
      cita
        ?.clientes
        ?.telefono


    if (!telefono) {
      return
    }


    const telefonoLimpio =
      telefono.replace(
        /\D/g,
        ''
      )


    const mensaje =
      `Hola ${cita.clientes?.nombre}, soy el técnico de DESTAPA YA asignado a tu servicio.`


    const url =
      `https://wa.me/52${telefonoLimpio}` +
      `?text=${encodeURIComponent(mensaje)}`


    window.open(
      url,
      '_blank'
    )
  }


  // ==========================================
  // CAMBIAR ESTADO CITA
  // ==========================================

  async function cambiarEstado(
    cita,
    nuevoEstado,
    datosAdicionales = {}
  ) {

    setProcesandoId(
      cita.id
    )

    setMensaje('')


    const {
      error
    } =
      await supabase
        .from('citas')
        .update({

          estado:
            nuevoEstado,

          ...datosAdicionales

        })
        .eq(
          'id',
          cita.id
        )


    if (error) {

      console.error(
        'Error actualizando cita:',
        error
      )


      setMensaje(
        'No fue posible actualizar el servicio: ' +
        error.message
      )


      setProcesandoId(null)

      return false
    }


    await cargarServicios()

    setProcesandoId(null)

    return true
  }


  // ==========================================
  // EN CAMINO
  // ==========================================

  async function marcarEnCamino(
    cita
  ) {

    const confirmar =
      window.confirm(
        '¿Confirmas que ya vas en camino al servicio?'
      )


    if (!confirmar) {
      return
    }


    const correcto =
      await cambiarEstado(
        cita,
        'EN_CAMINO',
        {
          fecha_en_camino:
            new Date()
              .toISOString()
        }
      )


    if (!correcto) {
      return
    }


    const telefono =
      cita
        ?.clientes
        ?.whatsapp ||
      cita
        ?.clientes
        ?.telefono


    if (!telefono) {
      return
    }


    const telefonoLimpio =
      telefono.replace(
        /\D/g,
        ''
      )


   const nombreTecnico =
  perfil?.nombre ||
  'Técnico DESTAPA YA'


const nombreVehiculo =
  cita?.vehiculos?.nombre_unidad ||
  ''


const placasVehiculo =
  cita?.vehiculos?.placas ||
  ''


const datosVehiculo =
  nombreVehiculo || placasVehiculo
    ? `
🚙 *Vehículo:*
${nombreVehiculo || 'Unidad DESTAPA YA'}
${placasVehiculo ? `Placas: ${placasVehiculo}` : ''}
`
    : ''


const mensaje = `
Hola ${cita.clientes?.nombre} 👋

Te informamos que *${nombreTecnico}*, técnico de *DESTAPA YA*, ya se encuentra en camino para atender tu servicio.

📍 *Servicio:*
${cita.tipos_servicio?.nombre || ''}
${datosVehiculo}
Nos vemos en unos momentos.

*DESTAPA YA*
Rapidez · Limpieza · Confianza
    `.trim()


    const url =
      `https://wa.me/52${telefonoLimpio}` +
      `?text=${encodeURIComponent(mensaje)}`


    window.open(
      url,
      '_blank'
    )
  }


  // ==========================================
  // OBTENER GPS
  // ==========================================

  function obtenerUbicacion() {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        if (
          !navigator.geolocation
        ) {

          reject(
            new Error(
              'Este dispositivo no permite obtener ubicación GPS.'
            )
          )

          return
        }


        navigator
          .geolocation
          .getCurrentPosition(

            (
              position
            ) => {

              resolve({

                latitud:
                  position
                    .coords
                    .latitude,

                longitud:
                  position
                    .coords
                    .longitude

              })
            },

            (
              error
            ) => {

              reject(
                error
              )
            },

            {
              enableHighAccuracy:
                true,

              timeout:
                15000,

              maximumAge:
                0
            }

          )
      }
    )
  }


  // ==========================================
  // LLEGUE AL SERVICIO
  // ==========================================

  async function marcarLlegada(
    cita
  ) {

    setProcesandoId(
      cita.id
    )

    setMensaje('')


    try {

      const ubicacion =
        await obtenerUbicacion()


      const correcto =
        await cambiarEstado(
          cita,
          'EN_SITIO',
          {

            fecha_llegada:
              new Date()
                .toISOString(),

            latitud_llegada:
              ubicacion.latitud,

            longitud_llegada:
              ubicacion.longitud

          }
        )


      if (!correcto) {
        return
      }


    } catch (error) {

      console.error(
        'Error GPS:',
        error
      )


      setMensaje(
        'No fue posible obtener la ubicación. ' +
        'Verifica que el navegador tenga permiso para usar GPS.'
      )


      setProcesandoId(null)
    }
  }


  // ==========================================
  // BUSCAR SERVICIO DE LA CITA
  // ==========================================

  async function buscarServicioPorCita(
    citaId
  ) {

    const {
      data,
      error
    } =
      await supabase
        .from('servicios')
        .select(`
          id,
          folio,
          cita_id,
          estado,
          fecha_inicio
        `)
        .eq(
          'cita_id',
          citaId
        )
        .order(
          'id',
          {
            ascending: true
          }
        )
        .limit(1)


    if (error) {

      throw new Error(
        'No fue posible verificar si la cita ya tiene un servicio: ' +
        error.message
      )
    }


    if (
      data &&
      data.length > 0
    ) {

      return data[0]
    }


    return null
  }


  // ==========================================
  // VERIFICAR ASIGNACION TECNICO
  // ==========================================

  async function asegurarTecnicoServicio(
    servicioId
  ) {

    const {
      data,
      error
    } =
      await supabase
        .from(
          'servicios_tecnicos'
        )
        .select(`
          id,
          servicio_id,
          tecnico_id
        `)
        .eq(
          'servicio_id',
          servicioId
        )
        .eq(
          'tecnico_id',
          perfil.id
        )
        .limit(1)


    if (error) {

      throw new Error(
        'No fue posible verificar la asignación del técnico: ' +
        error.message
      )
    }


    if (
      data &&
      data.length > 0
    ) {

      return true
    }


    const {
      error:
        errorAsignacion
    } =
      await supabase
        .from(
          'servicios_tecnicos'
        )
        .insert({

          servicio_id:
            servicioId,

          tecnico_id:
            perfil.id

        })


    if (
      errorAsignacion
    ) {

      throw new Error(
        'No fue posible asignar el servicio al técnico: ' +
        errorAsignacion.message
      )
    }


    return true
  }


  // ==========================================
  // CREAR SERVICIO
  // ==========================================

  async function crearServicio(
    cita,
    fechaInicio
  ) {

    if (
      !cita?.cliente_id
    ) {

      throw new Error(
        'La cita no tiene un cliente asociado.'
      )
    }


    const {
      data,
      error
    } =
      await supabase
        .from('servicios')
        .insert({

          cita_id:
            cita.id,

          cliente_id:
            cita.cliente_id,

          direccion_id:
            cita.direccion_id ||
            null,

          tipo_servicio_id:
            cita.tipo_servicio_id ||
            null,

          vehiculo_id:
            cita.vehiculo_id ||
            null,

          problema_reportado:
            cita.descripcion_problema ||
            null,

          estado:
            'EN_PROCESO',

          fecha_inicio:
            fechaInicio

        })
        .select(`
          id,
          folio,
          cita_id,
          estado,
          fecha_inicio
        `)
        .single()


    if (error) {

      throw new Error(
        'No fue posible crear el servicio: ' +
        error.message
      )
    }


    // ========================================
    // ASIGNAR TECNICO AL NUEVO SERVICIO
    // ========================================

    await asegurarTecnicoServicio(
      data.id
    )


    return data
  }


  // ==========================================
  // ACTUALIZAR SERVICIO EXISTENTE
  // ==========================================

  async function actualizarServicioExistente(
    servicio,
    fechaInicio
  ) {

    if (
      servicio.estado ===
      'CONCLUIDO'
    ) {

      throw new Error(
        'Este servicio ya se encuentra concluido.'
      )
    }


    const {
      data,
      error
    } =
      await supabase
        .from('servicios')
        .update({

          estado:
            'EN_PROCESO',

          fecha_inicio:
            servicio.fecha_inicio ||
            fechaInicio

        })
        .eq(
          'id',
          servicio.id
        )
        .select(`
          id,
          folio,
          cita_id,
          estado,
          fecha_inicio
        `)
        .single()


    if (error) {

      throw new Error(
        'No fue posible actualizar el servicio existente: ' +
        error.message
      )
    }


    // ========================================
    // ASEGURAR ASIGNACION TECNICO
    // ========================================

    await asegurarTecnicoServicio(
      servicio.id
    )


    return data
  }


  // ==========================================
  // INICIAR SERVICIO
  // ==========================================

  async function iniciarServicio(
    cita
  ) {

    const confirmar =
      window.confirm(
        '¿Deseas iniciar el servicio?'
      )


    if (!confirmar) {
      return
    }


    setProcesandoId(
      cita.id
    )

    setMensaje('')


    const fechaInicio =
      new Date()
        .toISOString()


    try {

      // ======================================
      // 1. BUSCAR SI YA EXISTE
      // ======================================

      let servicio =
        await buscarServicioPorCita(
          cita.id
        )


      // ======================================
      // 2. CREAR O RECUPERAR
      // ======================================

      if (!servicio) {

        servicio =
          await crearServicio(
            cita,
            fechaInicio
          )

      } else {

        servicio =
          await actualizarServicioExistente(
            servicio,
            fechaInicio
          )
      }


      // ======================================
      // 3. ACTUALIZAR CITA
      // ======================================

      const {
        error:
          errorCita
      } =
        await supabase
          .from('citas')
          .update({

            estado:
              'EN_PROCESO',

            fecha_inicio:
              fechaInicio

          })
          .eq(
            'id',
            cita.id
          )


      if (errorCita) {

        throw new Error(
          'El servicio se creó, pero no fue posible actualizar la cita: ' +
          errorCita.message
        )
      }


      // ======================================
      // 4. RECARGAR SERVICIOS
      // ======================================

      await cargarServicios()


      setMensaje(
        `Servicio ${servicio.folio} iniciado correctamente.`
      )


    } catch (error) {

      console.error(
        'Error iniciando servicio:',
        error
      )


      setMensaje(
        error?.message ||
        'No fue posible iniciar el servicio.'
      )


    } finally {

      setProcesandoId(null)
    }
  }


  // ==========================================
  // CONTINUAR SERVICIO
  // ==========================================

  function continuarServicio(
    cita
  ) {

    setServicioEnEjecucion(
      cita
    )
  }


  // ==========================================
  // CLASE ESTADO
  // ==========================================

  function claseEstado(
    estado
  ) {

    switch (estado) {

      case 'PROGRAMADO':
        return 'programado'


      case 'CONFIRMADO':
        return 'confirmado'


      case 'REPROGRAMADO':
        return 'reprogramado'


      case 'EN_CAMINO':
        return 'camino'


      case 'EN_SITIO':
        return 'sitio'


      case 'EN_PROCESO':
        return 'proceso'


      case 'CONCLUIDO':
        return 'concluido'


      case 'CANCELADO':
        return 'cancelado'


      default:
        return ''
    }
  }


  // ==========================================
  // PANTALLA EJECUCION
  // ==========================================

  if (
    servicioEnEjecucion
  ) {

    return (

      <EjecucionServicio

        cita={
          servicioEnEjecucion
        }


        onVolver={() => {

          setServicioEnEjecucion(
            null
          )

          cargarServicios()

        }}

      />

    )
  }


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (

    <div className="tec-page">


      {/* ======================================
          CABECERA
      ====================================== */}

      <header className="tec-header">

        <div>

          <span className="tec-eyebrow">
            OPERACIÓN EN CAMPO
          </span>


          <h1>
            Mis servicios
          </h1>


          <p>
            Hola, {perfil?.nombre}
          </p>

        </div>


        <div className="tec-avatar">

          {
            perfil
              ?.nombre
              ?.charAt(0)
              ?.toUpperCase()
          }

        </div>

      </header>


      <main className="tec-content">


        {/* ======================================
            FECHA
        ====================================== */}

        <section className="tec-date-card">

          <div>

            <span>
              AGENDA
            </span>


            <h2>

              {
                formatearFecha(
                  fechaSeleccionada
                )
              }

            </h2>


            <p>

              {citas.length}{' '}

              {
                citas.length === 1
                  ? 'servicio asignado'
                  : 'servicios asignados'
              }

            </p>

          </div>


          <input
            type="date"
            value={
              fechaSeleccionada
            }
            onChange={(e) =>
              setFechaSeleccionada(
                e.target.value
              )
            }
          />

        </section>


        {/* ======================================
            MENSAJES
        ====================================== */}

        {
          mensaje && (

            <div className="tec-message">
              {mensaje}
            </div>

          )
        }


        {/* ======================================
            SERVICIOS
        ====================================== */}

        {
          cargando
            ? (

              <div className="tec-empty">
                Cargando servicios...
              </div>

            )

            : citas.length === 0
              ? (

                <div className="tec-empty">

                  <div className="tec-empty-icon">
                    ✓
                  </div>


                  <h3>
                    Sin servicios pendientes
                  </h3>


                  <p>
                    No tienes servicios asignados para esta fecha.
                  </p>

                </div>

              )

              : (

                <div className="tec-list">

                  {
                    citas.map(
                      (
                        cita
                      ) => (

                        <article
                          key={
                            cita.id
                          }
                          className="tec-service-card"
                        >


                          {/* ========================
                              CABECERA
                          ======================== */}

                          <div className="tec-service-top">

                            <div>

                              <span className="tec-time">

                                {
                                  formatearHora(
                                    cita.hora_estimada
                                  )
                                }

                              </span>


                              <h2>

                                {
                                  cita
                                    ?.clientes
                                    ?.nombre
                                }

                              </h2>


                              <p className="tec-service-type">

                                {
                                  cita
                                    ?.tipos_servicio
                                    ?.nombre
                                }

                              </p>

                            </div>


                            <span
                              className={
                                `tec-status ${claseEstado(
                                  cita.estado
                                )}`
                              }
                            >

                              {
                                cita
                                  ?.estado
                                  ?.replaceAll(
                                    '_',
                                    ' '
                                  )
                              }

                            </span>

                          </div>


                          {/* ========================
                              DIRECCION
                          ======================== */}

                          <div className="tec-address">

                            <span>
                              📍
                            </span>


                            <div>

                              <small>
                                UBICACIÓN
                              </small>


                              <strong>

                                {
                                  obtenerDireccion(
                                    cita
                                  )
                                }

                              </strong>

                            </div>

                          </div>


                          {/* ========================
                              PROBLEMA
                          ======================== */}

                          <div className="tec-problem">

                            <small>
                              PROBLEMA REPORTADO
                            </small>


                            <p>

                              {
                                cita
                                  .descripcion_problema
                              }

                            </p>

                          </div>


                          {/* ========================
                              CONTACTO
                          ======================== */}

                          <div className="tec-contact-grid">

                            <button
                              type="button"
                              onClick={() =>
                                llamarCliente(
                                  cita
                                )
                              }
                            >
                              📞

                              <span>
                                Llamar
                              </span>

                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                abrirWhatsApp(
                                  cita
                                )
                              }
                            >
                              💬

                              <span>
                                WhatsApp
                              </span>

                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                abrirMapa(
                                  cita
                                )
                              }
                            >
                              📍

                              <span>
                                Ubicación
                              </span>

                            </button>

                          </div>


                          {/* ========================
                              ACCIONES
                          ======================== */}

                          <div className="tec-flow-actions">


                            {/* CONFIRMADO */}

                            {
                              cita.estado ===
                                'CONFIRMADO' && (

                                <button
                                  type="button"
                                  className="tec-main-action"

                                  disabled={
                                    procesandoId ===
                                    cita.id
                                  }

                                  onClick={() =>
                                    marcarEnCamino(
                                      cita
                                    )
                                  }
                                >
                                  🚐 EN CAMINO
                                </button>

                              )
                            }


                            {/* EN CAMINO */}

                            {
                              cita.estado ===
                                'EN_CAMINO' && (

                                <button
                                  type="button"
                                  className="tec-main-action"

                                  disabled={
                                    procesandoId ===
                                    cita.id
                                  }

                                  onClick={() =>
                                    marcarLlegada(
                                      cita
                                    )
                                  }
                                >
                                  📍 LLEGUÉ AL SERVICIO
                                </button>

                              )
                            }


                            {/* EN SITIO */}

                            {
                              cita.estado ===
                                'EN_SITIO' && (

                                <button
                                  type="button"
                                  className="tec-main-action"

                                  disabled={
                                    procesandoId ===
                                    cita.id
                                  }

                                  onClick={() =>
                                    iniciarServicio(
                                      cita
                                    )
                                  }
                                >

                                  {
                                    procesandoId ===
                                    cita.id
                                      ? 'INICIANDO...'
                                      : '🔧 INICIAR SERVICIO'
                                  }

                                </button>

                              )
                            }


                            {/* EN PROCESO */}

                            {
                              cita.estado ===
                                'EN_PROCESO' && (
                                  


                                <button
                                  type="button"
                                  className="tec-main-action working"

                                  onClick={() =>
                                    continuarServicio(
                                      cita
                                    )
                                  }
                                  
                                >
                                  🔧 CONTINUAR SERVICIO
                                </button>

                              )
                            }


{/* CONCLUIDO / REPORTE AL CLIENTE */}

{cita.estado ===
  'CONCLUIDO' && (

  <EnviarReporteCliente
    cita={cita}
    perfil={perfil}
  />

)}


                            {/* PROGRAMADO */}

                            {
                              cita.estado ===
                                'PROGRAMADO' && (

                                <div className="tec-waiting">

                                  Cita programada. Esperando confirmación del administrador.

                                </div>

                              )
                            }


                            {/* REPROGRAMADO */}

                            {
                              cita.estado ===
                                'REPROGRAMADO' && (

                                <div className="tec-waiting">

                                  Servicio reprogramado. Esperando confirmación del administrador.

                                </div>

                              )
                            }


                            {/* CONCLUIDO */}

                            {
                              cita.estado ===
                                'CONCLUIDO' && (

                                <div className="tec-waiting">

                                  Servicio concluido. Esperando confirmación del administrador.

                                </div>

                              )
                            }


                            {/* CANCELADO */}

                            {
                              cita.estado ===
                                'CANCELADO' && (

                                <div className="tec-waiting">

                                  Servicio cancelado.

                                </div>

                              )
                            }

                          </div>

                        </article>

                      )
                    )
                  }

                </div>

              )
        }


        {/* ======================================
            CERRAR SESION
        ====================================== */}

        <div className="tec-footer">

          <button
            type="button"
            onClick={
              cerrarSesion
            }
          >
            Cerrar sesión
          </button>

        </div>

      </main>

    </div>
  )
}


export default Tecnico