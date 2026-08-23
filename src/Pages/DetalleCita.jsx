import {
  useEffect,
  useState
} from 'react'

import { supabase } from '../supabase'
import './DetalleCita.css'


function DetalleCita({
  cita,
  onVolver,
  onConfirmar,
  onWhatsApp,
  onCancelar,
  onReprogramar
}) {

  // ==========================================
  // CANCELACION
  // ==========================================

  const [
    modalCancelar,
    setModalCancelar
  ] = useState(false)

  const [
    motivosCancelacion,
    setMotivosCancelacion
  ] = useState([])

  const [
    motivoSeleccionado,
    setMotivoSeleccionado
  ] = useState('')

  const [
    detalleCancelacion,
    setDetalleCancelacion
  ] = useState('')

  const [
    cargandoMotivos,
    setCargandoMotivos
  ] = useState(false)

  const [
    procesandoCancelacion,
    setProcesandoCancelacion
  ] = useState(false)

  const [
    errorCancelacion,
    setErrorCancelacion
  ] = useState('')


  // ==========================================
  // CARGAR MOTIVOS
  // ==========================================

  useEffect(() => {

    if (
      modalCancelar
    ) {

      cargarMotivosCancelacion()
    }

  }, [modalCancelar])


  async function cargarMotivosCancelacion() {

    setCargandoMotivos(true)
    setErrorCancelacion('')


    const {
      data,
      error
    } =
      await supabase
        .from(
          'motivos_cancelacion'
        )
        .select(`
          id,
          nombre,
          activo
        `)
        .eq(
          'activo',
          true
        )
        .order(
          'id',
          {
            ascending:
              true
          }
        )


    if (
      error
    ) {

      console.error(
        'Error cargando motivos:',
        error
      )

      setMotivosCancelacion([])

      setErrorCancelacion(
        'No fue posible cargar los motivos de cancelación.'
      )

      setCargandoMotivos(false)

      return
    }


    setMotivosCancelacion(
      data || []
    )

    setCargandoMotivos(false)
  }


  // ==========================================
  // ABRIR CANCELACION
  // ==========================================

  function abrirCancelacion() {

    setMotivoSeleccionado('')
    setDetalleCancelacion('')
    setErrorCancelacion('')
    setModalCancelar(true)
  }


  // ==========================================
  // CERRAR CANCELACION
  // ==========================================

  function cerrarCancelacion() {

    if (
      procesandoCancelacion
    ) {
      return
    }


    setModalCancelar(false)
    setMotivoSeleccionado('')
    setDetalleCancelacion('')
    setErrorCancelacion('')
  }


  // ==========================================
  // CONFIRMAR CANCELACION
  // ==========================================

  async function confirmarCancelacion() {

    if (
      !motivoSeleccionado
    ) {

      setErrorCancelacion(
        'Selecciona un motivo de cancelación.'
      )

      return
    }


    const motivo =
      motivosCancelacion.find(
        (
          item
        ) =>
          String(
            item.id
          ) ===
          String(
            motivoSeleccionado
          )
      )


    if (
      motivo?.nombre ===
        'OTRO' &&
      !detalleCancelacion.trim()
    ) {

      setErrorCancelacion(
        'Escribe el detalle de la cancelación.'
      )

      return
    }


    const confirmar =
      window.confirm(
        '¿Confirmas que deseas cancelar esta cita?'
      )


    if (
      !confirmar
    ) {
      return
    }


    setProcesandoCancelacion(true)
    setErrorCancelacion('')


    try {

      await onCancelar(
        cita,
        {
          motivo_cancelacion_id:
            Number(
              motivoSeleccionado
            ),

          detalle_cancelacion:
            detalleCancelacion.trim() ||
            null
        }
      )


      setModalCancelar(false)


    } catch (
      error
    ) {

      console.error(
        'Error cancelando cita:',
        error
      )


      setErrorCancelacion(
        error?.message ||
        'No fue posible cancelar la cita.'
      )


    } finally {

      setProcesandoCancelacion(false)
    }
  }


  // ==========================================
  // FORMATEAR HORA
  // ==========================================

  function formatearHora(hora) {

    if (!hora) {
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
  // FORMATEAR FECHA
  // ==========================================

  function formatearFecha(fecha) {

    if (!fecha) {
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


  // ==========================================
  // DIRECCION
  // ==========================================

  function obtenerDireccion() {

    const direccion =
      cita
        ?.direcciones_cliente


    if (
      !direccion
    ) {

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

      direccion.municipio,

      direccion.estado

    ]
      .filter(Boolean)
      .join(', ')
  }


  // ==========================================
  // TECNICOS
  // ==========================================

  function obtenerTecnicos() {

    const asignaciones =
      cita
        ?.citas_tecnicos ||
      []


    if (
      asignaciones.length === 0
    ) {

      return 'Sin técnico asignado'
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
  // PERMISOS
  // ==========================================

  const puedeConfirmar =
    [
      'PROGRAMADO',
      'REPROGRAMADO'
    ].includes(
      cita?.estado
    )


  const puedeModificar =
    ![
      'CONCLUIDO',
      'CANCELADO'
    ].includes(
      cita?.estado
    )


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (

    <div className="dcita-page">


      <header className="dcita-topbar">

        <div>

          <button
            type="button"
            className="dcita-back"
            onClick={
              onVolver
            }
          >
            ← Volver a Agenda
          </button>


          <h1>
            Detalle de cita
          </h1>


          <p>
            Consulta toda la información del servicio programado
          </p>

        </div>


        <div className="dcita-brand">
          DESTAPA YA
        </div>

      </header>


      <main className="dcita-content">


        {/* ======================================
            HERO
        ====================================== */}

        <section className="dcita-hero">

          <div>

            <span>
              CITA #{cita?.id}
            </span>


            <h2>
              {
                cita
                  ?.clientes
                  ?.nombre
              }
            </h2>


            <p>
              {
                cita
                  ?.tipos_servicio
                  ?.nombre
              }
            </p>

          </div>


          <div className="dcita-status">

            {
              cita
                ?.estado
                ?.replaceAll(
                  '_',
                  ' '
                )
            }

          </div>

        </section>


        {/* ======================================
            DATOS GENERALES
        ====================================== */}

        <section className="dcita-grid">

          <div className="dcita-card">

            <span className="dcita-label">
              FECHA Y HORA
            </span>


            <h3>
              {
                formatearFecha(
                  cita?.fecha
                )
              }
            </h3>


            <p>
              {
                formatearHora(
                  cita?.hora_estimada
                )
              }
            </p>

          </div>


          <div className="dcita-card">

            <span className="dcita-label">
              CLIENTE
            </span>


            <h3>
              {
                cita
                  ?.clientes
                  ?.nombre
              }
            </h3>


            <p>
              {
                cita
                  ?.clientes
                  ?.telefono
              }
            </p>

          </div>


          <div className="dcita-card">

            <span className="dcita-label">
              TÉCNICO
            </span>


            <h3>
              {obtenerTecnicos()}
            </h3>


            <p>
              Técnico asignado al servicio
            </p>

          </div>


          <div className="dcita-card">

            <span className="dcita-label">
              VEHÍCULO
            </span>


            <h3>

              {
                cita?.vehiculos
                  ? cita
                      .vehiculos
                      .nombre_unidad
                  : 'Sin asignar'
              }

            </h3>


            <p>
              {
                cita
                  ?.vehiculos
                  ?.placas ||
                ''
              }
            </p>

          </div>

        </section>


        {/* ======================================
            DIRECCION
        ====================================== */}

        <section className="dcita-card full">

          <span className="dcita-label">
            DIRECCIÓN
          </span>


          <h3>

            {
              cita
                ?.direcciones_cliente
                ?.nombre_ubicacion ||
              'Ubicación'
            }

          </h3>


          <p>
            {obtenerDireccion()}
          </p>

        </section>


        {/* ======================================
            PROBLEMA
        ====================================== */}

        <section className="dcita-card full">

          <span className="dcita-label">
            PROBLEMA REPORTADO
          </span>


          <p className="dcita-text">

            {
              cita
                ?.descripcion_problema
            }

          </p>

        </section>


        {/* ======================================
            OBSERVACIONES
        ====================================== */}

        <section className="dcita-card full">

          <span className="dcita-label">
            OBSERVACIONES
          </span>


          <p className="dcita-text">

            {
              cita
                ?.observaciones ||
              'Sin observaciones adicionales.'
            }

          </p>

        </section>


        {/* ======================================
            ACCIONES
        ====================================== */}

        <section className="dcita-actions">

          <button
            type="button"
            className="dcita-secondary"
            onClick={
              onVolver
            }
          >
            Volver
          </button>


          {
            puedeModificar && (

              <button
                type="button"
                className="dcita-secondary"
                onClick={() =>
                  onReprogramar(
                    cita
                  )
                }
              >
                Reprogramar
              </button>

            )
          }


          {
            puedeConfirmar && (

              <button
                type="button"
                className="dcita-confirm"
                onClick={() =>
                  onConfirmar(
                    cita
                  )
                }
              >
                Confirmar cita
              </button>

            )
          }


          <button
            type="button"
            className="dcita-whatsapp"
            onClick={() =>
              onWhatsApp(
                cita
              )
            }
          >
            WhatsApp
          </button>


          {
            puedeModificar && (

              <button
                type="button"
                className="dcita-cancel"
                onClick={
                  abrirCancelacion
                }
              >
                Cancelar cita
              </button>

            )
          }

        </section>

      </main>


      {/* ========================================
          MODAL CANCELAR CITA
      ======================================== */}

      {
        modalCancelar && (

          <div className="dcita-modal-overlay">

            <div className="dcita-modal">

              <div className="dcita-modal-header">

                <div>

                  <span className="dcita-modal-label">
                    CANCELACIÓN
                  </span>


                  <h2>
                    Cancelar cita
                  </h2>


                  <p>
                    Cita #{cita?.id} · {
                      cita
                        ?.clientes
                        ?.nombre
                    }
                  </p>

                </div>


                <button
                  type="button"
                  className="dcita-modal-close"
                  onClick={
                    cerrarCancelacion
                  }
                  disabled={
                    procesandoCancelacion
                  }
                >
                  ✕
                </button>

              </div>


              <div className="dcita-modal-body">

                <div className="dcita-warning">

                  <strong>
                    Esta acción cancelará la cita.
                  </strong>


                  <p>
                    Selecciona el motivo correspondiente antes de continuar.
                  </p>

                </div>


                <div className="dcita-form-group">

                  <label>
                    Motivo de cancelación *
                  </label>


                  {
                    cargandoMotivos
                      ? (

                        <div className="dcita-loading">
                          Cargando motivos...
                        </div>

                      )
                      : (

                        <select
                          value={
                            motivoSeleccionado
                          }
                          onChange={(e) => {

                            setMotivoSeleccionado(
                              e.target.value
                            )

                            setErrorCancelacion('')

                          }}
                          disabled={
                            procesandoCancelacion
                          }
                        >

                          <option value="">
                            Selecciona un motivo
                          </option>


                          {
                            motivosCancelacion.map(
                              (
                                motivo
                              ) => (

                                <option
                                  key={
                                    motivo.id
                                  }
                                  value={
                                    motivo.id
                                  }
                                >
                                  {motivo.nombre}
                                </option>

                              )
                            )
                          }

                        </select>

                      )
                  }

                </div>


                <div className="dcita-form-group">

                  <label>
                    Detalle de cancelación
                  </label>


                  <textarea
                    rows="4"
                    value={
                      detalleCancelacion
                    }
                    onChange={(e) => {

                      setDetalleCancelacion(
                        e.target.value
                      )

                      setErrorCancelacion('')

                    }}
                    disabled={
                      procesandoCancelacion
                    }
                    placeholder="Agrega información adicional sobre la cancelación..."
                  />


                  <small>
                    Si seleccionas OTRO, este campo es obligatorio.
                  </small>

                </div>


                {
                  errorCancelacion && (

                    <div className="dcita-modal-error">
                      {errorCancelacion}
                    </div>

                  )
                }

              </div>


              <div className="dcita-modal-actions">

                <button
                  type="button"
                  className="dcita-modal-secondary"
                  onClick={
                    cerrarCancelacion
                  }
                  disabled={
                    procesandoCancelacion
                  }
                >
                  No cancelar
                </button>


                <button
                  type="button"
                  className="dcita-modal-danger"
                  onClick={
                    confirmarCancelacion
                  }
                  disabled={
                    procesandoCancelacion ||
                    cargandoMotivos
                  }
                >

                  {
                    procesandoCancelacion
                      ? 'CANCELANDO...'
                      : 'Confirmar cancelación'
                  }

                </button>

              </div>

            </div>

          </div>

        )
      }

    </div>
  )
}


export default DetalleCita