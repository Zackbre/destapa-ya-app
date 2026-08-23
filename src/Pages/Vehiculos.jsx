import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { supabase } from '../supabase'
import './Vehiculos.css'


const ESTADOS = [
  {
    value: 'DISPONIBLE',
    label: 'Disponible'
  },
  {
    value: 'EN_SERVICIO',
    label: 'En servicio'
  },
  {
    value: 'MANTENIMIENTO',
    label: 'Mantenimiento'
  },
  {
    value: 'FUERA_DE_SERVICIO',
    label: 'Fuera de servicio'
  }
]


function formularioVacio() {
  return {
    nombre_unidad: '',
    placas: '',
    marca: '',
    modelo: '',
    anio: '',
    color: '',
    kilometraje_actual: '',
    proximo_servicio_km: '',
    ultimo_servicio_fecha: '',
    seguro_vigencia: '',
    estado_operativo: 'DISPONIBLE',
    activo: true,
    notas: ''
  }
}


function Vehiculos({ onVolver }) {

  const [vehiculos, setVehiculos] =
    useState([])

  const [gastos, setGastos] =
    useState([])

  const [citas, setCitas] =
    useState([])

  const [cargando, setCargando] =
    useState(true)

  const [guardando, setGuardando] =
    useState(false)

  const [mensaje, setMensaje] =
    useState('')

  const [busqueda, setBusqueda] =
    useState('')

  const [filtroEstado, setFiltroEstado] =
    useState('TODOS')

  const [filtroActivo, setFiltroActivo] =
    useState('ACTIVOS')

  const [
    mostrandoFormulario,
    setMostrandoFormulario
  ] = useState(false)

  const [vehiculoEditando, setVehiculoEditando] =
    useState(null)

  const [formulario, setFormulario] =
    useState(formularioVacio())

  const [
    vehiculoSeleccionado,
    setVehiculoSeleccionado
  ] = useState(null)


  useEffect(() => {
    cargarTodo()
  }, [])


  // ==========================================
  // CARGA
  // ==========================================

  async function cargarTodo() {
    setCargando(true)
    setMensaje('')

    try {

      const [
        vehiculosResultado,
        gastosResultado,
        citasResultado
      ] =
        await Promise.all([

          supabase
            .from('vehiculos')
            .select(`
              id,
              nombre_unidad,
              placas,
              marca,
              modelo,
              anio,
              color,
              kilometraje_actual,
              proximo_servicio_km,
              ultimo_servicio_fecha,
              seguro_vigencia,
              estado_operativo,
              activo,
              notas,
              created_at,
              updated_at
            `)
            .order(
              'id',
              {
                ascending: true
              }
            ),

          supabase
            .from('gastos')
            .select(`
              id,
              fecha,
              categoria,
              descripcion,
              importe,
              proveedor,
              activo,

              vehiculos (
                id,
                nombre_unidad,
                placas
              )
            `)
            .eq(
              'activo',
              true
            )
            .order(
              'fecha',
              {
                ascending: false
              }
            ),

          supabase
            .from('citas')
            .select(`
              id,
              fecha,
              hora_estimada,
              estado,
              descripcion_problema,

              clientes (
                id,
                nombre
              ),

              tipos_servicio (
                id,
                nombre
              ),

              vehiculos (
                id,
                nombre_unidad,
                placas
              )
            `)
            .order(
              'fecha',
              {
                ascending: false
              }
            )
        ])


      if (vehiculosResultado.error) {
        throw vehiculosResultado.error
      }

      if (gastosResultado.error) {
        throw gastosResultado.error
      }

      if (citasResultado.error) {
        throw citasResultado.error
      }


      setVehiculos(
        vehiculosResultado.data || []
      )

      setGastos(
        gastosResultado.data || []
      )

      setCitas(
        citasResultado.data || []
      )

    } catch (error) {

      console.error(
        'Error cargando vehículos:',
        error
      )

      setMensaje(
        'No fue posible cargar Vehículos. ' +
        'Si todavía no ejecutaste la actualización SQL del módulo, hazlo primero. Detalle: ' +
        error.message
      )

    } finally {
      setCargando(false)
    }
  }


  // ==========================================
  // FORMATO
  // ==========================================

  function formatearMoneda(valor) {
    return new Intl.NumberFormat(
      'es-MX',
      {
        style: 'currency',
        currency: 'MXN'
      }
    ).format(
      Number(valor || 0)
    )
  }


  function formatearNumero(valor) {
    return new Intl.NumberFormat(
      'es-MX'
    ).format(
      Number(valor || 0)
    )
  }


  function formatearFecha(valor) {
    if (!valor) {
      return '—'
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    ).format(
      new Date(
        `${valor}T12:00:00`
      )
    )
  }


  function estadoLabel(valor) {
    return (
      ESTADOS.find(
        item =>
          item.value === valor
      )?.label ||
      valor ||
      'Sin estado'
    )
  }


  function fechaInicioMes() {
    const hoy =
      new Date()

    const anio =
      hoy.getFullYear()

    const mes =
      String(
        hoy.getMonth() + 1
      ).padStart(
        2,
        '0'
      )

    return `${anio}-${mes}-01`
  }


  function fechaInicioAnio() {
    return `${new Date().getFullYear()}-01-01`
  }


  // ==========================================
  // RESÚMENES POR VEHÍCULO
  // ==========================================

  function gastosVehiculo(
    vehiculoId
  ) {
    return gastos.filter(
      gasto =>
        gasto
          ?.vehiculos
          ?.id ===
        vehiculoId
    )
  }


  function citasVehiculo(
    vehiculoId
  ) {
    return citas.filter(
      cita =>
        cita
          ?.vehiculos
          ?.id ===
        vehiculoId
    )
  }


  function sumarGastos(
    lista
  ) {
    return lista.reduce(
      (
        total,
        gasto
      ) =>
        total +
        Number(
          gasto.importe ||
          0
        ),
      0
    )
  }


  function gastoMesVehiculo(
    vehiculoId
  ) {
    const inicio =
      fechaInicioMes()

    return sumarGastos(
      gastosVehiculo(
        vehiculoId
      ).filter(
        gasto =>
          gasto.fecha >=
          inicio
      )
    )
  }


  function gastoAnioVehiculo(
    vehiculoId
  ) {
    const inicio =
      fechaInicioAnio()

    return sumarGastos(
      gastosVehiculo(
        vehiculoId
      ).filter(
        gasto =>
          gasto.fecha >=
          inicio
      )
    )
  }


  function serviciosMesVehiculo(
    vehiculoId
  ) {
    const inicio =
      fechaInicioMes()

    return citasVehiculo(
      vehiculoId
    ).filter(
      cita =>
        cita.fecha >=
        inicio &&
        cita.estado !==
        'CANCELADO'
    ).length
  }


  // ==========================================
  // KPIs
  // ==========================================

  const kpis =
    useMemo(
      () => {

        const activos =
          vehiculos.filter(
            vehiculo =>
              vehiculo.activo !==
              false
          )

        const disponibles =
          activos.filter(
            vehiculo =>
              vehiculo.estado_operativo ===
              'DISPONIBLE'
          ).length

        const mantenimiento =
          activos.filter(
            vehiculo =>
              vehiculo.estado_operativo ===
              'MANTENIMIENTO'
          ).length

        const inicioMes =
          fechaInicioMes()

        const gastoMes =
          sumarGastos(
            gastos.filter(
              gasto =>
                gasto.fecha >=
                  inicioMes &&
                gasto.vehiculos
            )
          )

        const serviciosMes =
          citas.filter(
            cita =>
              cita.fecha >=
                inicioMes &&
              cita.vehiculos &&
              cita.estado !==
                'CANCELADO'
          ).length

        return {
          activos:
            activos.length,
          disponibles,
          mantenimiento,
          gastoMes,
          serviciosMes
        }
      },
      [
        vehiculos,
        gastos,
        citas
      ]
    )


  // ==========================================
  // FILTROS
  // ==========================================

  const vehiculosFiltrados =
    useMemo(
      () => {

        const texto =
          busqueda
            .trim()
            .toLowerCase()

        return vehiculos.filter(
          vehiculo => {

            const coincideTexto =
              !texto ||
              [
                vehiculo.nombre_unidad,
                vehiculo.placas,
                vehiculo.marca,
                vehiculo.modelo,
                vehiculo.color
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(texto)

            const coincideEstado =
              filtroEstado ===
                'TODOS' ||
              vehiculo.estado_operativo ===
                filtroEstado

            const coincideActivo =
              filtroActivo ===
                'TODOS' ||
              (
                filtroActivo ===
                  'ACTIVOS' &&
                vehiculo.activo !==
                  false
              ) ||
              (
                filtroActivo ===
                  'INACTIVOS' &&
                vehiculo.activo ===
                  false
              )

            return (
              coincideTexto &&
              coincideEstado &&
              coincideActivo
            )
          }
        )
      },
      [
        vehiculos,
        busqueda,
        filtroEstado,
        filtroActivo
      ]
    )


  // ==========================================
  // FORMULARIO
  // ==========================================

  function cambiarCampo(
    campo,
    valor
  ) {
    setFormulario(
      anterior => ({
        ...anterior,
        [campo]:
          valor
      })
    )
  }


  function nuevoVehiculo() {
    setVehiculoEditando(null)
    setFormulario(
      formularioVacio()
    )
    setMostrandoFormulario(true)
    setMensaje('')
  }


  function editarVehiculo(
    vehiculo
  ) {
    setVehiculoEditando(
      vehiculo
    )

    setFormulario({
      nombre_unidad:
        vehiculo.nombre_unidad ||
        '',

      placas:
        vehiculo.placas ||
        '',

      marca:
        vehiculo.marca ||
        '',

      modelo:
        vehiculo.modelo ||
        '',

      anio:
        vehiculo.anio ??
        '',

      color:
        vehiculo.color ||
        '',

      kilometraje_actual:
        vehiculo.kilometraje_actual ??
        '',

      proximo_servicio_km:
        vehiculo.proximo_servicio_km ??
        '',

      ultimo_servicio_fecha:
        vehiculo.ultimo_servicio_fecha ||
        '',

      seguro_vigencia:
        vehiculo.seguro_vigencia ||
        '',

      estado_operativo:
        vehiculo.estado_operativo ||
        'DISPONIBLE',

      activo:
        vehiculo.activo !==
        false,

      notas:
        vehiculo.notas ||
        ''
    })

    setMostrandoFormulario(
      true
    )

    setMensaje('')
  }


  function cerrarFormulario() {
    if (guardando) {
      return
    }

    setMostrandoFormulario(
      false
    )

    setVehiculoEditando(
      null
    )

    setFormulario(
      formularioVacio()
    )
  }


  async function guardarVehiculo(
    evento
  ) {
    evento.preventDefault()

    if (
      !formulario
        .nombre_unidad
        .trim()
    ) {
      window.alert(
        'Escribe el nombre de la unidad.'
      )
      return
    }

    if (
      !formulario
        .placas
        .trim()
    ) {
      window.alert(
        'Escribe las placas del vehículo.'
      )
      return
    }


    const datos = {

      nombre_unidad:
        formulario
          .nombre_unidad
          .trim(),

      placas:
        formulario
          .placas
          .trim()
          .toUpperCase(),

      marca:
        formulario.marca
          .trim() ||
        null,

      modelo:
        formulario.modelo
          .trim() ||
        null,

      anio:
        formulario.anio
          ? Number(
              formulario.anio
            )
          : null,

      color:
        formulario.color
          .trim() ||
        null,

      kilometraje_actual:
        formulario.kilometraje_actual !==
          ''
          ? Number(
              formulario
                .kilometraje_actual
            )
          : null,

      proximo_servicio_km:
        formulario.proximo_servicio_km !==
          ''
          ? Number(
              formulario
                .proximo_servicio_km
            )
          : null,

      ultimo_servicio_fecha:
        formulario
          .ultimo_servicio_fecha ||
        null,

      seguro_vigencia:
        formulario
          .seguro_vigencia ||
        null,

      estado_operativo:
        formulario
          .estado_operativo,

      activo:
        Boolean(
          formulario.activo
        ),

      notas:
        formulario.notas
          .trim() ||
        null,

      updated_at:
        new Date()
          .toISOString()
    }


    setGuardando(true)
    setMensaje('')

    try {

      if (vehiculoEditando) {

        const {
          error
        } =
          await supabase
            .from('vehiculos')
            .update(
              datos
            )
            .eq(
              'id',
              vehiculoEditando.id
            )

        if (error) {
          throw error
        }

      } else {

        const {
          error
        } =
          await supabase
            .from('vehiculos')
            .insert(
              datos
            )

        if (error) {
          throw error
        }
      }


      setMostrandoFormulario(
        false
      )

      setVehiculoEditando(
        null
      )

      setFormulario(
        formularioVacio()
      )

      await cargarTodo()

    } catch (error) {

      console.error(
        'Error guardando vehículo:',
        error
      )

      setMensaje(
        'No fue posible guardar el vehículo: ' +
        error.message
      )

    } finally {
      setGuardando(false)
    }
  }


  async function cambiarActivo(
    vehiculo
  ) {

    const nuevoValor =
      vehiculo.activo ===
      false

    const confirmar =
      window.confirm(
        nuevoValor
          ? `¿Reactivar ${vehiculo.nombre_unidad}?`
          : `¿Desactivar ${vehiculo.nombre_unidad}? El historial de servicios y gastos se conservará.`
      )

    if (!confirmar) {
      return
    }

    try {

      const {
        error
      } =
        await supabase
          .from('vehiculos')
          .update({
            activo:
              nuevoValor,
            updated_at:
              new Date()
                .toISOString()
          })
          .eq(
            'id',
            vehiculo.id
          )

      if (error) {
        throw error
      }

      await cargarTodo()

    } catch (error) {

      console.error(
        'Error cambiando estado del vehículo:',
        error
      )

      window.alert(
        'No fue posible actualizar el vehículo: ' +
        error.message
      )
    }
  }


  // ==========================================
  // EXPEDIENTE
  // ==========================================

  function abrirExpediente(
    vehiculo
  ) {
    setVehiculoSeleccionado(
      vehiculo
    )
  }


  function cerrarExpediente() {
    setVehiculoSeleccionado(
      null
    )
  }


  const detalleSeleccionado =
    useMemo(
      () => {

        if (
          !vehiculoSeleccionado
        ) {
          return null
        }

        const listaGastos =
          gastosVehiculo(
            vehiculoSeleccionado.id
          )

        const listaCitas =
          citasVehiculo(
            vehiculoSeleccionado.id
          )

        return {
          gastos:
            listaGastos,
          citas:
            listaCitas,
          gastoMes:
            gastoMesVehiculo(
              vehiculoSeleccionado.id
            ),
          gastoAnio:
            gastoAnioVehiculo(
              vehiculoSeleccionado.id
            ),
          gastoHistorico:
            sumarGastos(
              listaGastos
            ),
          serviciosMes:
            serviciosMesVehiculo(
              vehiculoSeleccionado.id
            ),
          serviciosHistoricos:
            listaCitas.filter(
              cita =>
                cita.estado !==
                'CANCELADO'
            ).length
        }
      },
      [
        vehiculoSeleccionado,
        gastos,
        citas
      ]
    )


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="veh-page">

      <header className="veh-header">

        <div>

          <button
            type="button"
            className="veh-back"
            onClick={
              onVolver
            }
          >
            ← Volver al Dashboard
          </button>

          <span className="veh-eyebrow">
            ADMINISTRACIÓN
          </span>

          <h1>
            Vehículos
          </h1>

          <p>
            Control de unidades, kilometraje, estado operativo, servicios y gastos.
          </p>

        </div>


        <button
          type="button"
          className="veh-new-button"
          onClick={
            nuevoVehiculo
          }
        >
          ＋ Nueva unidad
        </button>

      </header>


      <main className="veh-content">

        {
          mensaje && (
            <div className="veh-message">
              {mensaje}
            </div>
          )
        }


        <section className="veh-kpis">

          <article className="veh-kpi veh-kpi-main">
            <span>
              Unidades activas
            </span>

            <strong>
              {kpis.activos}
            </strong>

            <small>
              Flotilla registrada
            </small>
          </article>


          <article className="veh-kpi">
            <span>
              Disponibles
            </span>

            <strong>
              {kpis.disponibles}
            </strong>

            <small>
              Listas para operar
            </small>
          </article>


          <article className="veh-kpi">
            <span>
              Mantenimiento
            </span>

            <strong>
              {kpis.mantenimiento}
            </strong>

            <small>
              Unidades detenidas
            </small>
          </article>


          <article className="veh-kpi">
            <span>
              Servicios este mes
            </span>

            <strong>
              {kpis.serviciosMes}
            </strong>

            <small>
              Con unidad asignada
            </small>
          </article>


          <article className="veh-kpi">
            <span>
              Gasto vehicular mes
            </span>

            <strong className="money">
              {
                formatearMoneda(
                  kpis.gastoMes
                )
              }
            </strong>

            <small>
              Gastos ligados a vehículos
            </small>
          </article>

        </section>


        <section className="veh-toolbar">

          <label className="veh-search">
            <span>
              Buscar
            </span>

            <input
              type="text"
              value={
                busqueda
              }
              onChange={
                evento =>
                  setBusqueda(
                    evento.target.value
                  )
              }
              placeholder="Unidad, placas, marca, modelo..."
            />
          </label>


          <label>
            <span>
              Estado
            </span>

            <select
              value={
                filtroEstado
              }
              onChange={
                evento =>
                  setFiltroEstado(
                    evento.target.value
                  )
              }
            >
              <option value="TODOS">
                Todos
              </option>

              {
                ESTADOS.map(
                  estado => (
                    <option
                      key={
                        estado.value
                      }
                      value={
                        estado.value
                      }
                    >
                      {estado.label}
                    </option>
                  )
                )
              }
            </select>
          </label>


          <label>
            <span>
              Registro
            </span>

            <select
              value={
                filtroActivo
              }
              onChange={
                evento =>
                  setFiltroActivo(
                    evento.target.value
                  )
              }
            >
              <option value="ACTIVOS">
                Activos
              </option>

              <option value="INACTIVOS">
                Inactivos
              </option>

              <option value="TODOS">
                Todos
              </option>
            </select>
          </label>


          <button
            type="button"
            className="veh-refresh"
            onClick={
              cargarTodo
            }
          >
            ↻ Actualizar
          </button>

        </section>


        <section className="veh-list-card">

          <div className="veh-list-header">

            <div>
              <h2>
                Flotilla
              </h2>

              <p>
                {
                  vehiculosFiltrados
                    .length
                } unidad(es)
              </p>
            </div>

          </div>


          {
            cargando
              ? (
                <div className="veh-empty">
                  Cargando vehículos...
                </div>
              )
              : vehiculosFiltrados
                  .length === 0
                ? (
                  <div className="veh-empty">

                    <div>
                      🚐
                    </div>

                    <h3>
                      Sin unidades
                    </h3>

                    <p>
                      Registra una nueva unidad o cambia los filtros.
                    </p>

                  </div>
                )
                : (
                  <div className="veh-grid">

                    {
                      vehiculosFiltrados.map(
                        vehiculo => {

                          const kmActual =
                            Number(
                              vehiculo
                                .kilometraje_actual ||
                              0
                            )

                          const kmProximo =
                            Number(
                              vehiculo
                                .proximo_servicio_km ||
                              0
                            )

                          const faltanKm =
                            kmProximo > 0
                              ? kmProximo -
                                kmActual
                              : null

                          return (
                            <article
                              key={
                                vehiculo.id
                              }
                              className={
                                `veh-card ${
                                  vehiculo.activo ===
                                    false
                                    ? 'inactive'
                                    : ''
                                }`
                              }
                            >

                              <div className="veh-card-top">

                                <div className="veh-unit-icon">
                                  🚐
                                </div>


                                <div className="veh-title-wrap">

                                  <span className="veh-unit-label">
                                    UNIDAD
                                  </span>

                                  <h3>
                                    {
                                      vehiculo
                                        .nombre_unidad
                                    }
                                  </h3>

                                  <p>
                                    {
                                      [
                                        vehiculo.marca,
                                        vehiculo.modelo,
                                        vehiculo.anio
                                      ]
                                        .filter(Boolean)
                                        .join(' · ') ||
                                      'Sin datos de modelo'
                                    }
                                  </p>

                                </div>


                                <span
                                  className={
                                    `veh-status ${
                                      (
                                        vehiculo
                                          .estado_operativo ||
                                        'DISPONIBLE'
                                      )
                                        .toLowerCase()
                                        .replaceAll(
                                          '_',
                                          '-'
                                        )
                                    }`
                                  }
                                >
                                  {
                                    estadoLabel(
                                      vehiculo
                                        .estado_operativo
                                    )
                                  }
                                </span>

                              </div>


                              <div className="veh-card-data">

                                <div>
                                  <span>
                                    PLACAS
                                  </span>

                                  <strong>
                                    {
                                      vehiculo.placas ||
                                      '—'
                                    }
                                  </strong>
                                </div>


                                <div>
                                  <span>
                                    KILOMETRAJE
                                  </span>

                                  <strong>
                                    {
                                      vehiculo
                                        .kilometraje_actual !==
                                        null &&
                                      vehiculo
                                        .kilometraje_actual !==
                                        undefined
                                        ? `${formatearNumero(
                                            vehiculo
                                              .kilometraje_actual
                                          )} km`
                                        : '—'
                                    }
                                  </strong>
                                </div>


                                <div>
                                  <span>
                                    SERVICIOS MES
                                  </span>

                                  <strong>
                                    {
                                      serviciosMesVehiculo(
                                        vehiculo.id
                                      )
                                    }
                                  </strong>
                                </div>


                                <div>
                                  <span>
                                    GASTOS MES
                                  </span>

                                  <strong>
                                    {
                                      formatearMoneda(
                                        gastoMesVehiculo(
                                          vehiculo.id
                                        )
                                      )
                                    }
                                  </strong>
                                </div>

                              </div>


                              {
                                faltanKm !==
                                  null && (

                                  <div
                                    className={
                                      `veh-maintenance-alert ${
                                        faltanKm <= 0
                                          ? 'urgent'
                                          : faltanKm <=
                                            1000
                                            ? 'warning'
                                            : ''
                                      }`
                                    }
                                  >

                                    <span>
                                      PRÓXIMO SERVICIO
                                    </span>

                                    <strong>
                                      {
                                        faltanKm <= 0
                                          ? `Vencido por ${formatearNumero(
                                              Math.abs(
                                                faltanKm
                                              )
                                            )} km`
                                          : `Faltan ${formatearNumero(
                                              faltanKm
                                            )} km`
                                      }
                                    </strong>

                                  </div>

                                )
                              }


                              <div className="veh-card-actions">

                                <button
                                  type="button"
                                  className="primary"
                                  onClick={() =>
                                    abrirExpediente(
                                      vehiculo
                                    )
                                  }
                                >
                                  Ver expediente
                                </button>


                                <button
                                  type="button"
                                  onClick={() =>
                                    editarVehiculo(
                                      vehiculo
                                    )
                                  }
                                >
                                  Editar
                                </button>


                                <button
                                  type="button"
                                  className={
                                    vehiculo.activo ===
                                      false
                                      ? 'activate'
                                      : 'danger'
                                  }
                                  onClick={() =>
                                    cambiarActivo(
                                      vehiculo
                                    )
                                  }
                                >
                                  {
                                    vehiculo.activo ===
                                      false
                                      ? 'Reactivar'
                                      : 'Desactivar'
                                  }
                                </button>

                              </div>

                            </article>
                          )
                        }
                      )
                    }

                  </div>
                )
          }

        </section>

      </main>


      {/* =======================================
          FORMULARIO
      ======================================= */}

      {
        mostrandoFormulario && (

          <div
            className="veh-modal-overlay"
            onMouseDown={
              evento => {

                if (
                  evento.target ===
                    evento.currentTarget
                ) {
                  cerrarFormulario()
                }
              }
            }
          >

            <div className="veh-modal">

              <header className="veh-modal-header">

                <div>

                  <span>
                    {
                      vehiculoEditando
                        ? 'EDITAR UNIDAD'
                        : 'NUEVA UNIDAD'
                    }
                  </span>

                  <h2>
                    {
                      vehiculoEditando
                        ? 'Actualizar vehículo'
                        : 'Registrar vehículo'
                    }
                  </h2>

                  <p>
                    Mantén actualizados los datos operativos y de mantenimiento de la unidad.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    cerrarFormulario
                  }
                >
                  ✕
                </button>

              </header>


              <form
                className="veh-form"
                onSubmit={
                  guardarVehiculo
                }
              >

                <div className="veh-form-grid">

                  <label>
                    <span>
                      Nombre de unidad *
                    </span>

                    <input
                      type="text"
                      value={
                        formulario
                          .nombre_unidad
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'nombre_unidad',
                            evento.target.value
                          )
                      }
                      placeholder="Ej. Unidad 1"
                      required
                    />
                  </label>


                  <label>
                    <span>
                      Placas *
                    </span>

                    <input
                      type="text"
                      value={
                        formulario.placas
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'placas',
                            evento.target.value
                          )
                      }
                      placeholder="ABC-123-A"
                      required
                    />
                  </label>


                  <label>
                    <span>
                      Marca
                    </span>

                    <input
                      type="text"
                      value={
                        formulario.marca
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'marca',
                            evento.target.value
                          )
                      }
                      placeholder="Nissan, Toyota..."
                    />
                  </label>


                  <label>
                    <span>
                      Modelo
                    </span>

                    <input
                      type="text"
                      value={
                        formulario.modelo
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'modelo',
                            evento.target.value
                          )
                      }
                      placeholder="NP300, Hilux..."
                    />
                  </label>


                  <label>
                    <span>
                      Año
                    </span>

                    <input
                      type="number"
                      min="1980"
                      max="2100"
                      value={
                        formulario.anio
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'anio',
                            evento.target.value
                          )
                      }
                    />
                  </label>


                  <label>
                    <span>
                      Color
                    </span>

                    <input
                      type="text"
                      value={
                        formulario.color
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'color',
                            evento.target.value
                          )
                      }
                    />
                  </label>


                  <label>
                    <span>
                      Kilometraje actual
                    </span>

                    <div className="veh-number-input">

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          formulario
                            .kilometraje_actual
                        }
                        onChange={
                          evento =>
                            cambiarCampo(
                              'kilometraje_actual',
                              evento.target.value
                            )
                        }
                        placeholder="0"
                      />

                      <span>
                        km
                      </span>

                    </div>
                  </label>


                  <label>
                    <span>
                      Próximo servicio
                    </span>

                    <div className="veh-number-input">

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          formulario
                            .proximo_servicio_km
                        }
                        onChange={
                          evento =>
                            cambiarCampo(
                              'proximo_servicio_km',
                              evento.target.value
                            )
                        }
                        placeholder="0"
                      />

                      <span>
                        km
                      </span>

                    </div>
                  </label>


                  <label>
                    <span>
                      Último mantenimiento
                    </span>

                    <input
                      type="date"
                      value={
                        formulario
                          .ultimo_servicio_fecha
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'ultimo_servicio_fecha',
                            evento.target.value
                          )
                      }
                    />
                  </label>


                  <label>
                    <span>
                      Vigencia seguro
                    </span>

                    <input
                      type="date"
                      value={
                        formulario
                          .seguro_vigencia
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'seguro_vigencia',
                            evento.target.value
                          )
                      }
                    />
                  </label>


                  <label>
                    <span>
                      Estado operativo
                    </span>

                    <select
                      value={
                        formulario
                          .estado_operativo
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'estado_operativo',
                            evento.target.value
                          )
                      }
                    >
                      {
                        ESTADOS.map(
                          estado => (
                            <option
                              key={
                                estado.value
                              }
                              value={
                                estado.value
                              }
                            >
                              {estado.label}
                            </option>
                          )
                        )
                      }
                    </select>
                  </label>


                  <label className="veh-checkbox-label">

                    <input
                      type="checkbox"
                      checked={
                        formulario.activo
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'activo',
                            evento.target.checked
                          )
                      }
                    />

                    <div>
                      <span>
                        Unidad activa
                      </span>

                      <small>
                        Disponible para asignaciones y administración.
                      </small>
                    </div>

                  </label>


                  <label className="full">
                    <span>
                      Notas
                    </span>

                    <textarea
                      rows="4"
                      value={
                        formulario.notas
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'notas',
                            evento.target.value
                          )
                      }
                      placeholder="Observaciones, mantenimientos pendientes, detalles de la unidad..."
                    />
                  </label>

                </div>


                <div className="veh-form-actions">

                  <button
                    type="button"
                    className="cancel"
                    onClick={
                      cerrarFormulario
                    }
                    disabled={
                      guardando
                    }
                  >
                    Cancelar
                  </button>


                  <button
                    type="submit"
                    className="save"
                    disabled={
                      guardando
                    }
                  >
                    {
                      guardando
                        ? 'Guardando...'
                        : vehiculoEditando
                          ? 'Guardar cambios'
                          : 'Registrar unidad'
                    }
                  </button>

                </div>

              </form>

            </div>

          </div>

        )
      }


      {/* =======================================
          EXPEDIENTE
      ======================================= */}

      {
        vehiculoSeleccionado &&
        detalleSeleccionado && (

          <div
            className="veh-modal-overlay"
            onMouseDown={
              evento => {

                if (
                  evento.target ===
                    evento.currentTarget
                ) {
                  cerrarExpediente()
                }
              }
            }
          >

            <div className="veh-modal veh-detail-modal">

              <header className="veh-modal-header">

                <div>

                  <span>
                    EXPEDIENTE DE UNIDAD
                  </span>

                  <h2>
                    {
                      vehiculoSeleccionado
                        .nombre_unidad
                    }
                  </h2>

                  <p>
                    {
                      [
                        vehiculoSeleccionado
                          .marca,
                        vehiculoSeleccionado
                          .modelo,
                        vehiculoSeleccionado
                          .anio,
                        vehiculoSeleccionado
                          .placas
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    }
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    cerrarExpediente
                  }
                >
                  ✕
                </button>

              </header>


              <div className="veh-detail-content">

                <section className="veh-detail-kpis">

                  <article>
                    <span>
                      Servicios mes
                    </span>

                    <strong>
                      {
                        detalleSeleccionado
                          .serviciosMes
                      }
                    </strong>
                  </article>


                  <article>
                    <span>
                      Gasto mes
                    </span>

                    <strong>
                      {
                        formatearMoneda(
                          detalleSeleccionado
                            .gastoMes
                        )
                      }
                    </strong>
                  </article>


                  <article>
                    <span>
                      Gasto anual
                    </span>

                    <strong>
                      {
                        formatearMoneda(
                          detalleSeleccionado
                            .gastoAnio
                        )
                      }
                    </strong>
                  </article>


                  <article>
                    <span>
                      Gasto histórico
                    </span>

                    <strong>
                      {
                        formatearMoneda(
                          detalleSeleccionado
                            .gastoHistorico
                        )
                      }
                    </strong>
                  </article>

                </section>


                <section className="veh-detail-card">

                  <div className="veh-section-header">

                    <div>
                      <h3>
                        Datos de la unidad
                      </h3>

                      <p>
                        Información operativa y mantenimiento
                      </p>
                    </div>


                    <button
                      type="button"
                      onClick={() => {

                        cerrarExpediente()

                        editarVehiculo(
                          vehiculoSeleccionado
                        )

                      }}
                    >
                      ✎ Editar
                    </button>

                  </div>


                  <div className="veh-info-grid">

                    <div>
                      <span>
                        PLACAS
                      </span>
                      <strong>
                        {
                          vehiculoSeleccionado
                            .placas ||
                          '—'
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        ESTADO
                      </span>
                      <strong>
                        {
                          estadoLabel(
                            vehiculoSeleccionado
                              .estado_operativo
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        KILOMETRAJE
                      </span>
                      <strong>
                        {
                          vehiculoSeleccionado
                            .kilometraje_actual !==
                            null &&
                          vehiculoSeleccionado
                            .kilometraje_actual !==
                            undefined
                            ? `${formatearNumero(
                                vehiculoSeleccionado
                                  .kilometraje_actual
                              )} km`
                            : '—'
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        PRÓXIMO SERVICIO
                      </span>
                      <strong>
                        {
                          vehiculoSeleccionado
                            .proximo_servicio_km
                            ? `${formatearNumero(
                                vehiculoSeleccionado
                                  .proximo_servicio_km
                              )} km`
                            : '—'
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        ÚLTIMO MANTENIMIENTO
                      </span>
                      <strong>
                        {
                          formatearFecha(
                            vehiculoSeleccionado
                              .ultimo_servicio_fecha
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        VIGENCIA SEGURO
                      </span>
                      <strong>
                        {
                          formatearFecha(
                            vehiculoSeleccionado
                              .seguro_vigencia
                          )
                        }
                      </strong>
                    </div>

                  </div>


                  {
                    vehiculoSeleccionado
                      .notas && (

                      <div className="veh-notes">

                        <span>
                          NOTAS
                        </span>

                        <p>
                          {
                            vehiculoSeleccionado
                              .notas
                          }
                        </p>

                      </div>

                    )
                  }

                </section>


                <section className="veh-detail-card">

                  <div className="veh-section-header">

                    <div>
                      <h3>
                        Servicios asignados
                      </h3>

                      <p>
                        {
                          detalleSeleccionado
                            .serviciosHistoricos
                        } servicio(s) históricos
                      </p>
                    </div>

                  </div>


                  {
                    detalleSeleccionado
                      .citas
                      .length === 0
                      ? (
                        <div className="veh-detail-empty">
                          Sin servicios asociados a esta unidad.
                        </div>
                      )
                      : (
                        <div className="veh-history-list">

                          {
                            detalleSeleccionado
                              .citas
                              .slice(
                                0,
                                10
                              )
                              .map(
                                cita => (

                                  <article
                                    key={
                                      cita.id
                                    }
                                  >

                                    <div>

                                      <span>
                                        {
                                          formatearFecha(
                                            cita.fecha
                                          )
                                        }
                                      </span>

                                      <strong>
                                        {
                                          cita
                                            ?.clientes
                                            ?.nombre ||
                                          'Cliente'
                                        }
                                      </strong>

                                      <small>
                                        {
                                          cita
                                            ?.tipos_servicio
                                            ?.nombre ||
                                          'Servicio'
                                        }
                                      </small>

                                    </div>


                                    <span className="veh-history-status">
                                      {
                                        cita.estado
                                          ?.replaceAll(
                                            '_',
                                            ' '
                                          )
                                      }
                                    </span>

                                  </article>

                                )
                              )
                          }

                        </div>
                      )
                  }

                </section>


                <section className="veh-detail-card">

                  <div className="veh-section-header">

                    <div>
                      <h3>
                        Gastos de la unidad
                      </h3>

                      <p>
                        Últimos movimientos ligados al vehículo
                      </p>
                    </div>

                  </div>


                  {
                    detalleSeleccionado
                      .gastos
                      .length === 0
                      ? (
                        <div className="veh-detail-empty">
                          Sin gastos asociados a esta unidad.
                        </div>
                      )
                      : (
                        <div className="veh-expense-list">

                          {
                            detalleSeleccionado
                              .gastos
                              .slice(
                                0,
                                10
                              )
                              .map(
                                gasto => (

                                  <article
                                    key={
                                      gasto.id
                                    }
                                  >

                                    <div>

                                      <span>
                                        {
                                          formatearFecha(
                                            gasto.fecha
                                          )
                                        }
                                      </span>

                                      <strong>
                                        {
                                          gasto.descripcion
                                        }
                                      </strong>

                                      <small>
                                        {
                                          gasto.categoria
                                        }
                                        {
                                          gasto.proveedor
                                            ? ` · ${gasto.proveedor}`
                                            : ''
                                        }
                                      </small>

                                    </div>


                                    <strong className="veh-expense-amount">
                                      {
                                        formatearMoneda(
                                          gasto.importe
                                        )
                                      }
                                    </strong>

                                  </article>

                                )
                              )
                          }

                        </div>
                      )
                  }

                </section>

              </div>

            </div>

          </div>

        )
      }

    </div>
  )
}


export default Vehiculos