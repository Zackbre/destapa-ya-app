import { useState } from 'react'
import { supabase } from '../supabase'
import './ReprogramarCita.css'

function ReprogramarCita({
  cita,
  onVolver,
  onGuardado
}) {
  const [fecha, setFecha] = useState(
    cita?.fecha || ''
  )

  const [hora, setHora] = useState(
    cita?.hora_estimada
      ? cita.hora_estimada.slice(0, 5)
      : ''
  )

  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')

  function limpiarError(campo) {
    setErrores((anteriores) => ({
      ...anteriores,
      [campo]: ''
    }))
  }

  function validar() {
    const nuevosErrores = {}

    if (!fecha) {
      nuevosErrores.fecha =
        'Selecciona la nueva fecha.'
    }

    if (!hora) {
      nuevosErrores.hora =
        'Selecciona la nueva hora.'
    }

    if (!motivo.trim()) {
      nuevosErrores.motivo =
        'Captura el motivo de la reprogramación.'
    }

    setErrores(nuevosErrores)

    return Object.keys(nuevosErrores).length === 0
  }

  async function guardar() {
    if (!validar()) {
      return
    }

    setGuardando(true)
    setMensaje('')

    const { data, error } = await supabase
      .from('citas')
      .update({
        fecha,
        hora_estimada: hora,
        estado: 'REPROGRAMADO',
        observaciones:
          `${cita?.observaciones || ''}\nReprogramación: ${motivo.trim()}`.trim()
      })
      .eq('id', cita.id)
      .select(`
        id,
        fecha,
        hora_estimada,
        descripcion_problema,
        observaciones,
        estado,

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
      .single()

    if (error) {
      console.error(error)

      setMensaje(
        'No fue posible reprogramar la cita: ' +
        error.message
      )

      setGuardando(false)
      return
    }

    onGuardado(data)
  }

  return (
    <div className="rp-page">

      <header className="rp-topbar">

        <div>

          <button
            type="button"
            className="rp-back"
            onClick={onVolver}
            disabled={guardando}
          >
            ← Volver
          </button>

          <h1>
            Reprogramar cita
          </h1>

          <p>
            Cambia la fecha y hora del servicio
          </p>

        </div>

        <div className="rp-brand">
          DESTAPA YA
        </div>

      </header>


      <main className="rp-content">

        <section className="rp-card">

          <div className="rp-header">

            <div>

              <span className="rp-eyebrow">
                REPROGRAMACIÓN
              </span>

              <h2>
                {cita?.clientes?.nombre}
              </h2>

              <p>
                Cita #{cita?.id}
              </p>

            </div>

            <div className="rp-icon">
              🗓️
            </div>

          </div>


          <div className="rp-current">

            <div>

              <small>
                FECHA ACTUAL
              </small>

              <strong>
                {cita?.fecha}
              </strong>

            </div>


            <div>

              <small>
                HORA ACTUAL
              </small>

              <strong>
                {cita?.hora_estimada
                  ? cita.hora_estimada.slice(0, 5)
                  : ''}
              </strong>

            </div>

          </div>


          <div className="rp-grid two">

            <div className="rp-field">

              <label>
                Nueva fecha *
              </label>

              <input
                type="date"
                value={fecha}
                className={
                  errores.fecha
                    ? 'rp-input-error'
                    : ''
                }
                onChange={(e) => {
                  setFecha(e.target.value)
                  limpiarError('fecha')
                }}
              />

              {errores.fecha && (
                <span className="rp-error">
                  {errores.fecha}
                </span>
              )}

            </div>


            <div className="rp-field">

              <label>
                Nueva hora *
              </label>

              <input
                type="time"
                value={hora}
                className={
                  errores.hora
                    ? 'rp-input-error'
                    : ''
                }
                onChange={(e) => {
                  setHora(e.target.value)
                  limpiarError('hora')
                }}
              />

              {errores.hora && (
                <span className="rp-error">
                  {errores.hora}
                </span>
              )}

            </div>

          </div>


          <div className="rp-field">

            <label>
              Motivo de la reprogramación *
            </label>

            <textarea
              rows="4"
              value={motivo}
              className={
                errores.motivo
                  ? 'rp-input-error'
                  : ''
              }
              onChange={(e) => {
                setMotivo(e.target.value)
                limpiarError('motivo')
              }}
              placeholder="Ejemplo: el cliente solicitó cambio de horario..."
            />

            {errores.motivo && (
              <span className="rp-error">
                {errores.motivo}
              </span>
            )}

          </div>


          {mensaje && (
            <div className="rp-message">
              {mensaje}
            </div>
          )}


          <div className="rp-actions">

            <button
              type="button"
              className="rp-secondary"
              onClick={onVolver}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="rp-primary"
              onClick={guardar}
              disabled={guardando}
            >
              {guardando
                ? 'Guardando...'
                : 'Guardar reprogramación'}
            </button>

          </div>

        </section>

      </main>

    </div>
  )
}

export default ReprogramarCita