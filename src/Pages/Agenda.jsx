import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { supabase } from '../supabase'

import DetalleCita from './DetalleCita.jsx'
import ReprogramarCita from './ReprogramarCita.jsx'

import './Agenda.css'


function Agenda({
  onVolver
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
    citaSeleccionada,
    setCitaSeleccionada
  ] = useState(null)


  const [
    citaReprogramar,
    setCitaReprogramar
  ] = useState(null)


  // ==========================================
  // CARGAR AL CAMBIAR FECHA
  // ==========================================

  useEffect(() => {

    cargarCitas()

  }, [fechaSeleccionada])


  // ==========================================
  // CARGAR CITAS
  // ==========================================

  async function cargarCitas() {

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
          fecha,
          hora_estimada,
          descripcion_problema,
          observaciones,
          estado,
          motivo_cancelacion_id,
          detalle_cancelacion,
          fecha_confirmacion,

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
            estado
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

          citas_tecnicos (
            tecnico_id,

            perfiles (
              id,
              nombre
            )
          )
        `)
        .eq(
          'fecha',
          fechaSeleccionada
        )
        .order(
          'hora_estimada',
          {
            ascending:
              true
          }
        )


    if (
      error
    ) {

      console.error(
        'Error cargando agenda:',
        error
      )


      setMensaje(
        'No se pudieron cargar las citas: ' +
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
  // FECHAS
  // ==========================================

  function cambiarDia(
    cantidad
  ) {

    const fecha =
      new Date(
        `${fechaSeleccionada}T12:00:00`
      )


    fecha.setDate(
      fecha.getDate() +
      cantidad
    )


    setFechaSeleccionada(
      fecha
        .toISOString()
        .split('T')[0]
    )
  }


  function irHoy() {

    setFechaSeleccionada(
      new Date()
        .toISOString()
        .split('T')[0]
    )
  }


  function formatearFecha(
    fecha
  ) {

    if (
      !fecha
    ) {
      return ''
    }


    const fechaObj =
      new Date(
        `${fecha}T12:00:00`
      )


    return new Intl.DateTimeFormat(
      'es-MX',
      {
        weekday:
          'long',

        day:
          'numeric',

        month:
          'long',

        year:
          'numeric'
      }
    ).format(
      fechaObj
    )
  }


  function formatearHora(
    hora
  ) {

    if (
      !hora
    ) {
      return ''
    }


    const partes =
      hora.split(
        ':'
      )


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
  // DIRECCION
  // ==========================================

  function obtenerDireccion(
    cita
  ) {

    const direccion =
      cita.direcciones_cliente


    if (
      !direccion
    ) {

      return 'Sin dirección'
    }


    return [

      direccion.calle,

      direccion.numero_exterior
        ? `#${direccion.numero_exterior}`
        : '',

      direccion.colonia,

      direccion.municipio

    ]
      .filter(Boolean)
      .join(', ')
  }


  // ==========================================
  // TECNICOS
  // ==========================================

  function obtenerTecnicos(
    cita
  ) {

    const asignaciones =
      cita.citas_tecnicos ||
      []


    if (
      asignaciones.length === 0
    ) {

      return 'Sin técnico'
    }


    return asignaciones
      .map(
        (
          item
        ) =>
          item
            .perfiles
            ?.nombre
      )
      .filter(Boolean)
      .join(', ')
  }


  // ==========================================
  // CLASE DEL ESTADO
  // ==========================================

  function estadoClase(
    estado
  ) {

    switch (
      estado
    ) {

      case 'PROGRAMADO':
        return 'programado'


      case 'CONFIRMADO':
        return 'confirmado'


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


      case 'REPROGRAMADO':
        return 'reprogramado'


      default:
        return ''
    }
  }


  // ==========================================
  // CONFIRMAR CITA
  // ==========================================

  async function confirmarCita(
    cita
  ) {

    const confirmar =
      window.confirm(
        `¿Confirmar la cita de ${cita.clientes?.nombre}?`
      )


    if (
      !confirmar
    ) {
      return
    }


    const {
      error
    } =
      await supabase
        .from('citas')
        .update({

          estado:
            'CONFIRMADO',

          fecha_confirmacion:
            new Date()
              .toISOString()

        })
        .eq(
          'id',
          cita.id
        )


    if (
      error
    ) {

      console.error(
        'Error confirmando cita:',
        error
      )


      window.alert(
        'No fue posible confirmar la cita: ' +
        error.message
      )

      return
    }


    if (
      citaSeleccionada?.id ===
      cita.id
    ) {

      setCitaSeleccionada({
        ...cita,

        estado:
          'CONFIRMADO',

        fecha_confirmacion:
          new Date()
            .toISOString()
      })
    }


    await cargarCitas()
  }


  // ==========================================
  // CANCELAR CITA
  // ==========================================

  async function cancelarCita(
    cita,
    datosCancelacion
  ) {

    if (
      !cita?.id
    ) {

      throw new Error(
        'No fue posible identificar la cita.'
      )
    }


    if (
      !datosCancelacion
        ?.motivo_cancelacion_id
    ) {

      throw new Error(
        'Selecciona un motivo de cancelación.'
      )
    }


    const {
      data,
      error
    } =
      await supabase
        .from('citas')
        .update({

          estado:
            'CANCELADO',

          motivo_cancelacion_id:
            datosCancelacion
              .motivo_cancelacion_id,

          detalle_cancelacion:
            datosCancelacion
              .detalle_cancelacion ||
            null

        })
        .eq(
          'id',
          cita.id
        )
        .select(`
          id,
          estado,
          motivo_cancelacion_id,
          detalle_cancelacion
        `)
        .single()


    if (
      error
    ) {

      console.error(
        'Error cancelando cita:',
        error
      )


      throw new Error(
        'No fue posible cancelar la cita: ' +
        error.message
      )
    }


    if (
      !data ||
      data.estado !==
        'CANCELADO'
    ) {

      throw new Error(
        'Supabase no confirmó la cancelación de la cita.'
      )
    }


    // Cerramos detalle después de cancelar
    setCitaSeleccionada(
      null
    )


    await cargarCitas()


    window.alert(
      `Cita #${cita.id} cancelada correctamente.`
    )


    return true
  }


  // ==========================================
  // WHATSAPP
  // ==========================================

  function enviarWhatsApp(
    cita
  ) {

    const cliente =
      cita.clientes


    const telefono =
      cliente?.whatsapp ||
      cliente?.telefono


    if (
      !telefono
    ) {

      window.alert(
        'El cliente no tiene WhatsApp registrado.'
      )

      return
    }


    const telefonoLimpio =
      telefono.replace(
        /\D/g,
        ''
      )


    const mensaje = `
Hola ${cliente?.nombre} 👋

Te confirmamos los datos de tu servicio con *DESTAPA YA*.

📅 *Fecha:* ${formatearFecha(cita.fecha)}
🕐 *Hora estimada:* ${formatearHora(cita.hora_estimada)}
🔧 *Servicio:* ${cita.tipos_servicio?.nombre || ''}
📍 *Dirección:* ${obtenerDireccion(cita)}

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
  // CANTIDAD DE CITAS
  // ==========================================

  const cantidadCitas =
    useMemo(
      () =>
        citas.length,
      [
        citas
      ]
    )


  // ==========================================
  // REPROGRAMAR
  // ==========================================

  if (
    citaReprogramar
  ) {

    return (

      <ReprogramarCita

        cita={
          citaReprogramar
        }


        onVolver={() => {

          setCitaReprogramar(
            null
          )

        }}


        onGuardado={(
          citaActualizada
        ) => {

          setCitaReprogramar(
            null
          )


          setCitaSeleccionada(
            citaActualizada
          )


          setFechaSeleccionada(
            citaActualizada.fecha
          )

        }}

      />

    )
  }


  // ==========================================
  // DETALLE
  // ==========================================

  if (
    citaSeleccionada
  ) {

    return (

      <DetalleCita

        cita={
          citaSeleccionada
        }


        onVolver={() => {

          setCitaSeleccionada(
            null
          )

        }}


        onConfirmar={async (
          cita
        ) => {

          await confirmarCita(
            cita
          )

        }}


        onWhatsApp={(
          cita
        ) => {

          enviarWhatsApp(
            cita
          )

        }}


        onCancelar={async (
          cita,
          datosCancelacion
        ) => {

          return await cancelarCita(
            cita,
            datosCancelacion
          )

        }}


        onReprogramar={(
          cita
        ) => {

          setCitaReprogramar(
            cita
          )

        }}

      />

    )
  }


  // ==========================================
  // AGENDA
  // ==========================================

  return (

    <div className="ag-page">


      <header className="ag-topbar">

        <div>

          <button
            type="button"
            className="ag-back"
            onClick={
              onVolver
            }
          >
            ← Dashboard
          </button>


          <h1>
            Agenda
          </h1>


          <p>
            Consulta y administra los servicios programados
          </p>

        </div>


        <div className="ag-brand">
          DESTAPA YA
        </div>

      </header>


      <main className="ag-content">


        {/* ======================================
            CONTROLES DE FECHA
        ====================================== */}

        <section className="ag-toolbar">

          <div className="ag-date-info">

            <span>
              AGENDA DEL DÍA
            </span>


            <h2>

              {
                formatearFecha(
                  fechaSeleccionada
                )
              }

            </h2>


            <p>

              {cantidadCitas}{' '}

              {
                cantidadCitas ===
                1
                  ? 'servicio programado'
                  : 'servicios programados'
              }

            </p>

          </div>


          <div className="ag-date-controls">

            <button
              type="button"
              onClick={() =>
                cambiarDia(
                  -1
                )
              }
            >
              ←
            </button>


            <button
              type="button"
              className="ag-today"
              onClick={
                irHoy
              }
            >
              Hoy
            </button>


            <input
              type="date"
              value={
                fechaSeleccionada
              }
              onChange={(
                e
              ) =>
                setFechaSeleccionada(
                  e.target.value
                )
              }
            />


            <button
              type="button"
              onClick={() =>
                cambiarDia(
                  1
                )
              }
            >
              →
            </button>

          </div>

        </section>


        {/* ======================================
            MENSAJE
        ====================================== */}

        {
          mensaje && (

            <div className="ag-message">
              {mensaje}
            </div>

          )
        }


        {/* ======================================
            CARGANDO
        ====================================== */}

        {
          cargando
            ? (

              <div className="ag-loading">
                Cargando agenda...
              </div>

            )

            : citas.length === 0
              ? (

                <div className="ag-empty">

                  <div>
                    📅
                  </div>


                  <h3>
                    No hay citas programadas
                  </h3>


                  <p>
                    No existen servicios para esta fecha.
                  </p>

                </div>

              )

              : (

                <div className="ag-list">

                  {
                    citas.map(
                      (
                        cita
                      ) => {


                        const puedeConfirmar =
                          [
                            'PROGRAMADO',
                            'REPROGRAMADO'
                          ].includes(
                            cita.estado
                          )


                        const puedeCancelar =
                          ![
                            'CONCLUIDO',
                            'CANCELADO'
                          ].includes(
                            cita.estado
                          )


                        return (

                          <article
                            className="ag-card"
                            key={
                              cita.id
                            }
                          >

                            {/* HORA */}

                            <div className="ag-time">

                              <strong>

                                {
                                  formatearHora(
                                    cita.hora_estimada
                                  )
                                }

                              </strong>


                              <span>
                                #{cita.id}
                              </span>

                            </div>


                            <div className="ag-main">


                              {/* CABECERA */}

                              <div className="ag-card-top">

                                <div>

                                  <h3>
                                    {
                                      cita
                                        .clientes
                                        ?.nombre
                                    }
                                  </h3>


                                  <p>
                                    {
                                      cita
                                        .tipos_servicio
                                        ?.nombre
                                    }
                                  </p>

                                </div>


                                <span
                                  className={
                                    `ag-status ${estadoClase(
                                      cita.estado
                                    )}`
                                  }
                                >

                                  {
                                    cita
                                      .estado
                                      ?.replaceAll(
                                        '_',
                                        ' '
                                      )
                                  }

                                </span>

                              </div>


                              {/* DATOS */}

                              <div className="ag-details">

                                <div>

                                  <small>
                                    TELÉFONO
                                  </small>


                                  <strong>
                                    {
                                      cita
                                        .clientes
                                        ?.telefono
                                    }
                                  </strong>

                                </div>


                                <div>

                                  <small>
                                    DIRECCIÓN
                                  </small>


                                  <strong>

                                    {
                                      obtenerDireccion(
                                        cita
                                      )
                                    }

                                  </strong>

                                </div>


                                <div>

                                  <small>
                                    TÉCNICO
                                  </small>


                                  <strong>

                                    {
                                      obtenerTecnicos(
                                        cita
                                      )
                                    }

                                  </strong>

                                </div>


                                <div>

                                  <small>
                                    VEHÍCULO
                                  </small>


                                  <strong>

                                    {
                                      cita.vehiculos

                                        ? `${cita.vehiculos.nombre_unidad}${
                                            cita.vehiculos.placas
                                              ? ` · ${cita.vehiculos.placas}`
                                              : ''
                                          }`

                                        : 'Sin asignar'
                                    }

                                  </strong>

                                </div>

                              </div>


                              {/* PROBLEMA */}

                              <div className="ag-problem">

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


                              {/* ACCIONES */}

                              <div className="ag-actions">

                                <button
                                  type="button"
                                  className="ag-action secondary"
                                  onClick={() => {

                                    setCitaSeleccionada(
                                      cita
                                    )

                                  }}
                                >
                                  Ver detalle
                                </button>


                                {
                                  puedeConfirmar && (

                                    <button
                                      type="button"
                                      className="ag-action confirm"
                                      onClick={() =>
                                        confirmarCita(
                                          cita
                                        )
                                      }
                                    >
                                      Confirmar
                                    </button>

                                  )
                                }


                                <button
                                  type="button"
                                  className="ag-action whatsapp"
                                  onClick={() =>
                                    enviarWhatsApp(
                                      cita
                                    )
                                  }
                                >
                                  WhatsApp
                                </button>


                                {
                                  puedeCancelar && (

                                    <button
                                      type="button"
                                      className="ag-action cancel"
                                      onClick={() => {

                                        /*
                                          Abrimos el detalle para utilizar
                                          el nuevo modal profesional de
                                          cancelación.
                                        */

                                        setCitaSeleccionada(
                                          cita
                                        )

                                      }}
                                    >
                                      Cancelar
                                    </button>

                                  )
                                }

                              </div>

                            </div>

                          </article>

                        )
                      }
                    )
                  }

                </div>

              )
        }

      </main>

    </div>
  )
}


export default Agenda