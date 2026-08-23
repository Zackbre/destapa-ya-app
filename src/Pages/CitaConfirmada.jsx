import './CitaConfirmada.css'

function CitaConfirmada({
  resultado,
  servicio,
  onDashboard
}) {
  const cita = resultado?.cita
  const cliente = resultado?.cliente
  const direccion = resultado?.direccion

  function formatearFecha(fecha) {
    if (!fecha) return ''

    const [anio, mes, dia] = fecha.split('-')

    return `${dia}/${mes}/${anio}`
  }

  function formatearHora(hora) {
    if (!hora) return ''

    const partes = hora.split(':')
    let horas = Number(partes[0])
    const minutos = partes[1]

    const periodo = horas >= 12 ? 'PM' : 'AM'

    horas = horas % 12 || 12

    return `${horas}:${minutos} ${periodo}`
  }

  function construirDireccion() {
    return [
      direccion?.calle,
      direccion?.numero_exterior
        ? `#${direccion.numero_exterior}`
        : '',
      direccion?.numero_interior
        ? `Int. ${direccion.numero_interior}`
        : '',
      direccion?.colonia,
      direccion?.municipio,
      direccion?.estado
    ]
      .filter(Boolean)
      .join(', ')
  }

  function enviarWhatsApp() {
    const telefono =
      cliente?.whatsapp ||
      cliente?.telefono

    if (!telefono) {
      alert(
        'El cliente no tiene un número de WhatsApp registrado.'
      )
      return
    }

    const telefonoLimpio =
      telefono.replace(/\D/g, '')

    const mensaje = `
Hola ${cliente?.nombre} 👋

Tu servicio con *DESTAPA YA* ha quedado programado.

📅 *Fecha:* ${formatearFecha(cita?.fecha)}
🕐 *Hora estimada:* ${formatearHora(cita?.hora_estimada)}
📍 *Dirección:* ${construirDireccion()}

🔧 *Problema reportado:*
${servicio?.descripcion_problema || ''}

Nuestro técnico se pondrá en camino de acuerdo con el horario programado.

*DESTAPA YA*
Rapidez · Limpieza · Confianza
Servicio 24/7
    `.trim()

    const url =
      `https://wa.me/52${telefonoLimpio}` +
      `?text=${encodeURIComponent(mensaje)}`

    window.open(url, '_blank')
  }

  return (
    <div className="cc-page">

      <div className="cc-card">

        <div className="cc-success-icon">
          ✓
        </div>

        <span className="cc-eyebrow">
          CITA REGISTRADA
        </span>

        <h1>
          ¡Cita creada correctamente!
        </h1>

        <p className="cc-intro">
          El servicio fue registrado en DESTAPA YA.
          Ahora puedes enviar la confirmación al cliente.
        </p>


        <div className="cc-summary">

          <div className="cc-item">
            <small>CLIENTE</small>

            <strong>
              {cliente?.nombre}
            </strong>

            <span>
              {cliente?.telefono}
            </span>
          </div>


          <div className="cc-item">
            <small>FECHA</small>

            <strong>
              {formatearFecha(cita?.fecha)}
            </strong>

            <span>
              {formatearHora(cita?.hora_estimada)}
            </span>
          </div>


          <div className="cc-item full">
            <small>DIRECCIÓN</small>

            <strong>
              {direccion?.nombre_ubicacion || 'Ubicación'}
            </strong>

            <span>
              {construirDireccion()}
            </span>
          </div>


          <div className="cc-item full">
            <small>PROBLEMA REPORTADO</small>

            <span>
              {servicio?.descripcion_problema}
            </span>
          </div>

        </div>


        <div className="cc-actions">

          <button
            className="cc-dashboard"
            onClick={onDashboard}
          >
            Ir al Dashboard
          </button>

          <button
            className="cc-whatsapp"
            onClick={enviarWhatsApp}
          >
            Enviar confirmación por WhatsApp
          </button>

        </div>

      </div>

    </div>
  )
}

export default CitaConfirmada