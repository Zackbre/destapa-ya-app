import { useMemo, useState } from 'react'
import { supabase } from '../supabase'
import './ProgramacionCita.css'

function ProgramacionCita({
  perfil,
  cliente,
  direccion,
  servicio,
  datosProgramacion,
  onVolver,
  onFinalizar
}) {
  const [fecha, setFecha] = useState(
    datosProgramacion?.fecha || ''
  )

  const [hora, setHora] = useState(
    datosProgramacion?.hora || ''
  )

  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [errores, setErrores] = useState({})

  const resumenDireccion = useMemo(() => {
    if (!direccion) return ''

    return [
      direccion.calle,
      direccion.numero_exterior
        ? `#${direccion.numero_exterior}`
        : '',
      direccion.numero_interior
        ? `Int. ${direccion.numero_interior}`
        : '',
      direccion.colonia,
      direccion.municipio,
      direccion.estado,
      direccion.codigo_postal
        ? `CP ${direccion.codigo_postal}`
        : ''
    ]
      .filter(Boolean)
      .join(', ')
  }, [direccion])


  function limpiarError(campo) {
    setErrores((anteriores) => ({
      ...anteriores,
      [campo]: ''
    }))
  }


  function validarFormulario() {
    const nuevosErrores = {}

    if (!fecha) {
      nuevosErrores.fecha =
        'Selecciona la fecha de la cita.'
    }

    if (!hora) {
      nuevosErrores.hora =
        'Selecciona la hora estimada.'
    }

    setErrores(nuevosErrores)

    return Object.keys(nuevosErrores).length === 0
  }


  async function guardarCita() {
    if (!validarFormulario()) {
      return
    }

    setGuardando(true)
    setMensaje('')

    try {
      let clienteId = cliente.id

      // ==========================================
      // 1. CREAR CLIENTE SI ES NUEVO
      // ==========================================

      if (cliente.es_nuevo) {
        const { data: clienteNuevo, error: clienteError } =
          await supabase
            .from('clientes')
            .insert({
              tipo_cliente: cliente.tipo_cliente,
              nombre: cliente.nombre,
              telefono: cliente.telefono,
              whatsapp: cliente.whatsapp || null,
              email: cliente.email || null,
              razon_social: cliente.razon_social || null,
              rfc: cliente.rfc || null,
              contacto_administrativo:
                cliente.contacto_administrativo || null,
              correo_administrativo:
                cliente.correo_administrativo || null,
              activo: true
            })
            .select()
            .single()

        if (clienteError) {
          throw clienteError
        }

        clienteId = clienteNuevo.id
      }


      // ==========================================
      // 2. CREAR DIRECCION SI ES NUEVA
      // ==========================================

      let direccionId = direccion.id

      if (direccion.es_nueva) {
        const { data: direccionNueva, error: direccionError } =
          await supabase
            .from('direcciones_cliente')
            .insert({
              cliente_id: clienteId,
              nombre_ubicacion:
                direccion.nombre_ubicacion || 'Ubicación',
              calle: direccion.calle,
              numero_exterior:
                direccion.numero_exterior || null,
              numero_interior:
                direccion.numero_interior || null,
              colonia:
                direccion.colonia || null,
              municipio:
                direccion.municipio || null,
              estado:
                direccion.estado || null,
              codigo_postal:
                direccion.codigo_postal || null,
              referencias:
                direccion.referencias || null,
              latitud:
                direccion.latitud || null,
              longitud:
                direccion.longitud || null,
              es_principal: false,
              activo: true
            })
            .select()
            .single()

        if (direccionError) {
          throw direccionError
        }

        direccionId = direccionNueva.id
      }


      // ==========================================
      // 3. CREAR CITA
      // ==========================================

      const { data: citaNueva, error: citaError } =
        await supabase
          .from('citas')
          .insert({
            cliente_id: clienteId,
            direccion_id: direccionId,
            tipo_servicio_id:
              servicio.tipo_servicio_id,
            vehiculo_id:
              servicio.vehiculo_id || null,
            fecha,
            hora_estimada: hora,
            descripcion_problema:
              servicio.descripcion_problema,
            observaciones:
              servicio.observaciones || null,
            estado: 'PROGRAMADO',
            creado_por: perfil.id
          })
          .select()
          .single()

      if (citaError) {
        throw citaError
      }


      // ==========================================
      // 4. ASIGNAR TECNICO
      // ==========================================

      const { error: tecnicoError } =
        await supabase
          .from('citas_tecnicos')
          .insert({
            cita_id: citaNueva.id,
            tecnico_id: servicio.tecnico_id
          })

      if (tecnicoError) {
        throw tecnicoError
      }


      // ==========================================
      // 5. RESULTADO
      // ==========================================

      onFinalizar({
        cita: citaNueva,

        cliente: {
          ...cliente,
          id: clienteId
        },

        direccion: {
          ...direccion,
          id: direccionId
        },

        programacion: {
          fecha,
          hora
        }
      })

    } catch (error) {
      console.error(error)

      setMensaje(
        'Error al guardar la cita: ' +
        error.message
      )
    }

    setGuardando(false)
  }


  return (
    <div className="pc-page">

      <header className="pc-topbar">

        <div>

          <button
            type="button"
            className="pc-back"
            onClick={onVolver}
            disabled={guardando}
          >
            ← Volver
          </button>

          <h1>Nueva cita</h1>

          <p>
            Programa y confirma los datos del servicio
          </p>

        </div>

        <div className="pc-brand">
          DESTAPA YA
        </div>

      </header>


      <main className="pc-content">

        <div className="pc-progress">

          <div className="pc-step complete">
            <span>✓</span>
            Cliente
          </div>

          <div className="pc-line active" />

          <div className="pc-step complete">
            <span>✓</span>
            Dirección
          </div>

          <div className="pc-line active" />

          <div className="pc-step complete">
            <span>✓</span>
            Servicio
          </div>

          <div className="pc-line active" />

          <div className="pc-step active">
            <span>4</span>
            Programación
          </div>

        </div>


        <section className="pc-card">

          <div className="pc-card-header">

            <div>

              <span className="pc-eyebrow">
                PROGRAMACIÓN
              </span>

              <h2>
                ¿Cuándo realizaremos el servicio?
              </h2>

              <p>
                Revisa los datos antes de confirmar.
              </p>

            </div>

            <div className="pc-icon">
              📅
            </div>

          </div>


          <div className="pc-grid two">

            <div className="pc-field">

              <label>
                Fecha *
              </label>

              <input
                type="date"
                value={fecha}
                className={
                  errores.fecha
                    ? 'pc-input-error'
                    : ''
                }
                onChange={(e) => {
                  setFecha(e.target.value)
                  limpiarError('fecha')
                }}
              />

              {errores.fecha && (
                <span className="pc-error">
                  {errores.fecha}
                </span>
              )}

            </div>


            <div className="pc-field">

              <label>
                Hora estimada *
              </label>

              <input
                type="time"
                value={hora}
                className={
                  errores.hora
                    ? 'pc-input-error'
                    : ''
                }
                onChange={(e) => {
                  setHora(e.target.value)
                  limpiarError('hora')
                }}
              />

              {errores.hora && (
                <span className="pc-error">
                  {errores.hora}
                </span>
              )}

            </div>

          </div>


          <div className="pc-summary">

            <div className="pc-summary-header">

              <div>

                <span>
                  RESUMEN DE LA CITA
                </span>

                <h3>
                  Verifica la información
                </h3>

              </div>

              <div className="pc-summary-badge">
                PROGRAMADO
              </div>

            </div>


            <div className="pc-summary-grid">

              <div className="pc-summary-item">

                <small>
                  CLIENTE
                </small>

                <strong>
                  {cliente?.nombre}
                </strong>

                <span>
                  {cliente?.telefono}
                </span>

              </div>


              <div className="pc-summary-item">

                <small>
                  DIRECCIÓN
                </small>

                <strong>
                  {direccion?.nombre_ubicacion || 'Ubicación'}
                </strong>

                <span>
                  {resumenDireccion}
                </span>

              </div>


              <div className="pc-summary-item">

                <small>
                  PROBLEMA REPORTADO
                </small>

                <strong>
                  Servicio solicitado
                </strong>

                <span>
                  {servicio?.descripcion_problema}
                </span>

              </div>


              <div className="pc-summary-item">

                <small>
                  TÉCNICO
                </small>

                <strong>
                  Técnico asignado
                </strong>

                <span>
                  El técnico seleccionado quedará
                  relacionado a la cita.
                </span>

              </div>

            </div>

          </div>


          {mensaje && (
            <div className="pc-message">
              {mensaje}
            </div>
          )}


          <div className="pc-actions">

            <button
              type="button"
              className="pc-secondary"
              onClick={onVolver}
              disabled={guardando}
            >
              ← Volver
            </button>


            <button
              type="button"
              className="pc-primary"
              onClick={guardarCita}
              disabled={guardando}
            >
              {guardando
                ? 'Guardando...'
                : 'Confirmar y guardar cita'}
            </button>

          </div>

        </section>

      </main>

    </div>
  )
}

export default ProgramacionCita