import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import './ServicioCita.css'

function ServicioCita({
  cliente,
  direccion,
  datosServicio,
  onVolver,
  onContinuar
}) {
  const [tiposServicio, setTiposServicio] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [vehiculos, setVehiculos] = useState([])

  const [tipoServicioId, setTipoServicioId] = useState(
    datosServicio?.tipo_servicio_id
      ? String(datosServicio.tipo_servicio_id)
      : ''
  )

  const [descripcionProblema, setDescripcionProblema] = useState(
    datosServicio?.descripcion_problema || ''
  )

  const [tecnicoId, setTecnicoId] = useState(
    datosServicio?.tecnico_id || ''
  )

  const [vehiculoId, setVehiculoId] = useState(
    datosServicio?.vehiculo_id
      ? String(datosServicio.vehiculo_id)
      : ''
  )

  const [observaciones, setObservaciones] = useState(
    datosServicio?.observaciones || ''
  )

  const [cargando, setCargando] = useState(true)

  const [errores, setErrores] = useState({})

  useEffect(() => {
    cargarCatalogos()
  }, [])

  async function cargarCatalogos() {
    setCargando(true)

    try {
      const [
        tiposResult,
        perfilesResult,
        vehiculosResult
      ] = await Promise.all([
        supabase
          .from('tipos_servicio')
          .select('id, nombre')
          .eq('activo', true)
          .order('nombre'),

        supabase
          .from('perfiles')
          .select(`
            id,
            nombre,
            activo,
            roles (
              nombre
            )
          `)
          .eq('activo', true),

        supabase
          .from('vehiculos')
          .select(`
            id,
            nombre_unidad,
            marca,
            modelo,
            placas,
            activo
          `)
          .eq('activo', true)
          .order('nombre_unidad')
      ])

      if (tiposResult.error) {
        console.error(
          'Error tipos servicio:',
          tiposResult.error
        )
      }

      if (perfilesResult.error) {
        console.error(
          'Error perfiles:',
          perfilesResult.error
        )
      }

      if (vehiculosResult.error) {
        console.error(
          'Error vehículos:',
          vehiculosResult.error
        )
      }

      setTiposServicio(
        tiposResult.data || []
      )

      setTecnicos(
        (perfilesResult.data || []).filter(
          (perfil) =>
            perfil.roles?.nombre === 'TECNICO'
        )
      )

      setVehiculos(
        vehiculosResult.data || []
      )

    } catch (error) {
      console.error(
        'Error cargando catálogos:',
        error
      )
    }

    setCargando(false)
  }


  function limpiarError(campo) {
    setErrores((anteriores) => ({
      ...anteriores,
      [campo]: ''
    }))
  }


  function validarFormulario() {
    const nuevosErrores = {}

    if (!tipoServicioId) {
      nuevosErrores.tipoServicio =
        'Selecciona el tipo de servicio.'
    }

    if (!descripcionProblema.trim()) {
      nuevosErrores.descripcion =
        'Captura una breve descripción del problema.'
    }

    if (!tecnicoId) {
      nuevosErrores.tecnico =
        'Selecciona el técnico asignado.'
    }

    setErrores(nuevosErrores)

    return Object.keys(nuevosErrores).length === 0
  }


  function continuar() {
    if (!validarFormulario()) {
      return
    }

    const datos = {
      tipo_servicio_id:
        Number(tipoServicioId),

      descripcion_problema:
        descripcionProblema.trim(),

      tecnico_id:
        tecnicoId,

      vehiculo_id:
        vehiculoId
          ? Number(vehiculoId)
          : null,

      observaciones:
        observaciones.trim()
    }

    onContinuar(datos)
  }


  return (
    <div className="sc-page">

      <header className="sc-topbar">

        <div>

          <button
            type="button"
            className="sc-back"
            onClick={onVolver}
          >
            ← Volver
          </button>

          <h1>Nueva cita</h1>

          <p>
            Define el servicio que requiere el cliente
          </p>

        </div>

        <div className="sc-brand">
          DESTAPA YA
        </div>

      </header>


      <main className="sc-content">

        <div className="sc-progress">

          <div className="sc-step complete">
            <span>✓</span>
            Cliente
          </div>

          <div className="sc-line active" />

          <div className="sc-step complete">
            <span>✓</span>
            Dirección
          </div>

          <div className="sc-line active" />

          <div className="sc-step active">
            <span>3</span>
            Servicio
          </div>

          <div className="sc-line" />

          <div className="sc-step">
            <span>4</span>
            Programación
          </div>

        </div>


        <section className="sc-card">

          <div className="sc-card-header">

            <div>

              <span className="sc-eyebrow">
                DATOS DEL SERVICIO
              </span>

              <h2>
                ¿Qué trabajo realizaremos?
              </h2>

              <p>
                Cliente:{' '}
                <strong>
                  {cliente?.nombre}
                </strong>
              </p>

              <p>
                Dirección:{' '}
                <strong>
                  {direccion?.calle}

                  {direccion?.numero_exterior
                    ? ` #${direccion.numero_exterior}`
                    : ''}
                </strong>
              </p>

            </div>

            <div className="sc-icon">
              🔧
            </div>

          </div>


          {cargando ? (

            <div className="sc-loading">
              Cargando catálogos...
            </div>

          ) : (

            <>

              {/* TIPO DE SERVICIO */}

              <div className="sc-field">

                <label>
                  Tipo de servicio *
                </label>

                <select
                  value={tipoServicioId}
                  className={
                    errores.tipoServicio
                      ? 'sc-input-error'
                      : ''
                  }
                  onChange={(e) => {
                    setTipoServicioId(
                      e.target.value
                    )

                    limpiarError(
                      'tipoServicio'
                    )
                  }}
                >

                  <option value="">
                    Selecciona un servicio
                  </option>

                  {tiposServicio.map(
                    (tipo) => (

                      <option
                        key={tipo.id}
                        value={tipo.id}
                      >
                        {tipo.nombre}
                      </option>

                    )
                  )}

                </select>

                {errores.tipoServicio && (
                  <span className="sc-error">
                    {errores.tipoServicio}
                  </span>
                )}

              </div>


              {/* DESCRIPCIÓN */}

              <div className="sc-field">

                <label>
                  Breve descripción del problema *
                </label>

                <textarea
                  rows="5"
                  value={descripcionProblema}
                  className={
                    errores.descripcion
                      ? 'sc-input-error'
                      : ''
                  }
                  onChange={(e) => {
                    setDescripcionProblema(
                      e.target.value
                    )

                    limpiarError(
                      'descripcion'
                    )
                  }}
                  placeholder="Ejemplo: sanitario obstruido, el agua sube al descargar..."
                />

                {errores.descripcion && (
                  <span className="sc-error">
                    {errores.descripcion}
                  </span>
                )}

              </div>


              <div className="sc-grid two">

                {/* TÉCNICO */}

                <div className="sc-field">

                  <label>
                    Técnico asignado *
                  </label>

                  <select
                    value={tecnicoId}
                    className={
                      errores.tecnico
                        ? 'sc-input-error'
                        : ''
                    }
                    onChange={(e) => {
                      setTecnicoId(
                        e.target.value
                      )

                      limpiarError(
                        'tecnico'
                      )
                    }}
                  >

                    <option value="">
                      Selecciona un técnico
                    </option>

                    {tecnicos.map(
                      (tecnico) => (

                        <option
                          key={tecnico.id}
                          value={tecnico.id}
                        >
                          {tecnico.nombre}
                        </option>

                      )
                    )}

                  </select>

                  {errores.tecnico && (
                    <span className="sc-error">
                      {errores.tecnico}
                    </span>
                  )}

                </div>


                {/* VEHÍCULO */}

                <div className="sc-field">

                  <label>
                    Vehículo
                  </label>

                  <select
                    value={vehiculoId}
                    onChange={(e) =>
                      setVehiculoId(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Sin asignar
                    </option>

                    {vehiculos.map(
                      (vehiculo) => (

                        <option
                          key={vehiculo.id}
                          value={vehiculo.id}
                        >
                          {vehiculo.nombre_unidad}

                          {vehiculo.placas
                            ? ` · ${vehiculo.placas}`
                            : ''}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* OBSERVACIONES */}

              <div className="sc-field">

                <label>
                  Observaciones
                </label>

                <textarea
                  rows="4"
                  value={observaciones}
                  onChange={(e) =>
                    setObservaciones(
                      e.target.value
                    )
                  }
                  placeholder="Información adicional para el técnico..."
                />

              </div>


              <div className="sc-actions">

                <button
                  type="button"
                  className="sc-secondary"
                  onClick={onVolver}
                >
                  ← Volver
                </button>

                <button
                  type="button"
                  className="sc-primary"
                  onClick={continuar}
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

export default ServicioCita