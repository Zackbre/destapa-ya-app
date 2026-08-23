import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import './DireccionCita.css'

function DireccionCita({
  cliente,
  direccionSeleccionada,
  onVolver,
  onContinuar
}) {
  const [direcciones, setDirecciones] = useState([])
  const [cargando, setCargando] = useState(false)
  const [modoNueva, setModoNueva] = useState(false)

  const [nombreUbicacion, setNombreUbicacion] = useState('')
  const [calle, setCalle] = useState('')
  const [numeroExterior, setNumeroExterior] = useState('')
  const [numeroInterior, setNumeroInterior] = useState('')
  const [colonia, setColonia] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [estado, setEstado] = useState('Nuevo León')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [referencias, setReferencias] = useState('')
  const [latitud, setLatitud] = useState('')
  const [longitud, setLongitud] = useState('')

  useEffect(() => {
    cargarDirecciones()
  }, [])

  async function cargarDirecciones() {
    if (!cliente?.id) {
      setModoNueva(true)
      return
    }

    setCargando(true)

    const { data, error } = await supabase
      .from('direcciones_cliente')
      .select('*')
      .eq('cliente_id', cliente.id)
      .eq('activo', true)
      .order('es_principal', { ascending: false })

    if (error) {
      console.error(error)
      setModoNueva(true)
      setCargando(false)
      return
    }

    setDirecciones(data || [])

    if (!data || data.length === 0) {
      setModoNueva(true)
    }

    setCargando(false)
  }

  function seleccionarDireccion(direccion) {
    onContinuar(direccion)
  }

  function continuarNuevaDireccion() {
    if (!calle.trim()) {
      alert('Captura la calle.')
      return
    }

    if (!municipio.trim()) {
      alert('Captura el municipio.')
      return
    }

    const nuevaDireccion = {
      id: null,
      cliente_id: cliente?.id || null,
      nombre_ubicacion: nombreUbicacion || 'Ubicación',
      calle,
      numero_exterior: numeroExterior,
      numero_interior: numeroInterior,
      colonia,
      municipio,
      estado,
      codigo_postal: codigoPostal,
      referencias,
      latitud: latitud ? Number(latitud) : null,
      longitud: longitud ? Number(longitud) : null,
      es_nueva: true
    }

    onContinuar(nuevaDireccion)
  }

  return (
    <div className="dc-page">

      <header className="dc-topbar">
        <div>
          <button
            className="dc-back"
            onClick={onVolver}
          >
            ← Volver
          </button>

          <h1>Nueva cita</h1>
          <p>Selecciona o registra la ubicación del servicio</p>
        </div>

        <div className="dc-brand">
          DESTAPA YA
        </div>
      </header>

      <main className="dc-content">

        <div className="dc-progress">
          <div className="dc-step complete">
            <span>✓</span>
            Cliente
          </div>

          <div className="dc-line active" />

          <div className="dc-step active">
            <span>2</span>
            Dirección
          </div>

          <div className="dc-line" />

          <div className="dc-step">
            <span>3</span>
            Servicio
          </div>

          <div className="dc-line" />

          <div className="dc-step">
            <span>4</span>
            Programación
          </div>
        </div>

        <section className="dc-card">

          <div className="dc-card-header">
            <div>
              <span className="dc-eyebrow">
                UBICACIÓN DEL SERVICIO
              </span>

              <h2>
                ¿Dónde realizaremos el trabajo?
              </h2>

              <p>
                Cliente: <strong>{cliente?.nombre || 'Nuevo cliente'}</strong>
              </p>
            </div>

            <div className="dc-icon">
              📍
            </div>
          </div>

          {!modoNueva && (
            <>
              <div className="dc-section-title">
                Direcciones guardadas
              </div>

              {cargando ? (
                <div className="dc-loading">
                  Cargando direcciones...
                </div>
              ) : (
                <div className="dc-address-grid">

                  {direcciones.map((direccion) => (
                    <button
                      key={direccion.id}
                      className={
                        direccionSeleccionada?.id === direccion.id
                          ? 'dc-address-card selected'
                          : 'dc-address-card'
                      }
                      onClick={() => seleccionarDireccion(direccion)}
                    >
                      <div className="dc-address-icon">
                        📍
                      </div>

                      <div>
                        <strong>
                          {direccion.nombre_ubicacion || 'Ubicación'}
                        </strong>

                        <span>
                          {direccion.calle}
                          {direccion.numero_exterior
                            ? ` #${direccion.numero_exterior}`
                            : ''}
                        </span>

                        <span>
                          {direccion.colonia || ''}
                        </span>

                        <span>
                          {direccion.municipio || ''}, {direccion.estado || ''}
                        </span>
                      </div>
                    </button>
                  ))}

                </div>
              )}

              <div className="dc-new-row">
                <button
                  className="dc-new-button"
                  onClick={() => setModoNueva(true)}
                >
                  + Registrar nueva dirección
                </button>
              </div>
            </>
          )}

          {modoNueva && (
            <>
              <div className="dc-section-title">
                Nueva dirección
              </div>

              <div className="dc-grid two">

                <div className="dc-field">
                  <label>Nombre de ubicación</label>

                  <input
                    type="text"
                    value={nombreUbicacion}
                    onChange={(e) => setNombreUbicacion(e.target.value)}
                    placeholder="Casa, oficina, sucursal..."
                  />
                </div>

                <div className="dc-field">
                  <label>Calle *</label>

                  <input
                    type="text"
                    value={calle}
                    onChange={(e) => setCalle(e.target.value)}
                    placeholder="Nombre de la calle"
                  />
                </div>

              </div>

              <div className="dc-grid three">

                <div className="dc-field">
                  <label>Número exterior</label>

                  <input
                    type="text"
                    value={numeroExterior}
                    onChange={(e) => setNumeroExterior(e.target.value)}
                    placeholder="123"
                  />
                </div>

                <div className="dc-field">
                  <label>Número interior</label>

                  <input
                    type="text"
                    value={numeroInterior}
                    onChange={(e) => setNumeroInterior(e.target.value)}
                    placeholder="A, 2B..."
                  />
                </div>

                <div className="dc-field">
                  <label>Código postal</label>

                  <input
                    type="text"
                    value={codigoPostal}
                    onChange={(e) => setCodigoPostal(e.target.value)}
                    placeholder="64000"
                  />
                </div>

              </div>

              <div className="dc-grid two">

                <div className="dc-field">
                  <label>Colonia</label>

                  <input
                    type="text"
                    value={colonia}
                    onChange={(e) => setColonia(e.target.value)}
                    placeholder="Colonia"
                  />
                </div>

                <div className="dc-field">
                  <label>Municipio *</label>

                  <input
                    type="text"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    placeholder="Monterrey"
                  />
                </div>

              </div>

              <div className="dc-grid two">

                <div className="dc-field">
                  <label>Estado</label>

                  <input
                    type="text"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    placeholder="Nuevo León"
                  />
                </div>

                <div className="dc-field">
                  <label>Referencias</label>

                  <input
                    type="text"
                    value={referencias}
                    onChange={(e) => setReferencias(e.target.value)}
                    placeholder="Entre calles, color de fachada..."
                  />
                </div>

              </div>

              <div className="dc-map-box">

                <div>
                  <strong>Ubicación GPS</strong>
                  <p>
                    Por ahora puedes dejar estos campos vacíos.
                    Más adelante agregaremos botón para obtener ubicación.
                  </p>
                </div>

                <div className="dc-grid two">

                  <div className="dc-field">
                    <label>Latitud</label>

                    <input
                      type="number"
                      step="any"
                      value={latitud}
                      onChange={(e) => setLatitud(e.target.value)}
                      placeholder="25.6866"
                    />
                  </div>

                  <div className="dc-field">
                    <label>Longitud</label>

                    <input
                      type="number"
                      step="any"
                      value={longitud}
                      onChange={(e) => setLongitud(e.target.value)}
                      placeholder="-100.3161"
                    />
                  </div>

                </div>
              </div>

              <div className="dc-actions">

                {direcciones.length > 0 && (
                  <button
                    className="dc-secondary"
                    onClick={() => setModoNueva(false)}
                  >
                    Ver direcciones guardadas
                  </button>
                )}

                <button
                  className="dc-primary"
                  onClick={continuarNuevaDireccion}
                >
                  Continuar →
                </button>

              </div>
            </>
          )}

        </section>

      </main>

    </div>
  )
}

export default DireccionCita