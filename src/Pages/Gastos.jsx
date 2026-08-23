import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { supabase } from '../supabase'
import './Gastos.css'


const CATEGORIAS = [
  'Combustible',
  'Consumibles / materiales',
  'Herramientas / maquinaria',
  'Mantenimiento de vehículo',
  'Refacciones',
  'Nómina / ayudantes',
  'Viáticos',
  'Casetas / estacionamiento',
  'Publicidad',
  'Comisiones',
  'Servicios / suscripciones',
  'Administración',
  'Otro'
]


const METODOS_PAGO = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'TARJETA',
  'OTRO'
]


function obtenerFechaLocal(fecha = new Date()) {
  const anio = fecha.getFullYear()
  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, '0')
  const dia = String(
    fecha.getDate()
  ).padStart(2, '0')

  return `${anio}-${mes}-${dia}`
}


function obtenerInicioMes(fecha = new Date()) {
  return obtenerFechaLocal(
    new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      1
    )
  )
}


function formularioVacio() {
  return {
    fecha: obtenerFechaLocal(),
    alcance: 'GENERAL',
    categoria: 'Combustible',
    descripcion: '',
    importe: '',
    proveedor: '',
    metodo_pago: 'EFECTIVO',
    referencia: '',
    servicio_id: '',
    vehiculo_id: '',
    notas: ''
  }
}


function Gastos({ onVolver }) {

  const [gastos, setGastos] =
    useState([])

  const [servicios, setServicios] =
    useState([])

  const [vehiculos, setVehiculos] =
    useState([])

  const [cargando, setCargando] =
    useState(true)

  const [guardando, setGuardando] =
    useState(false)

  const [mensaje, setMensaje] =
    useState('')

  const [busqueda, setBusqueda] =
    useState('')

  const [fechaDesde, setFechaDesde] =
    useState(obtenerInicioMes())

  const [fechaHasta, setFechaHasta] =
    useState(obtenerFechaLocal())

  const [filtroAlcance, setFiltroAlcance] =
    useState('TODOS')

  const [filtroCategoria, setFiltroCategoria] =
    useState('TODAS')

  const [
    mostrandoFormulario,
    setMostrandoFormulario
  ] = useState(false)

  const [gastoEditando, setGastoEditando] =
    useState(null)

  const [formulario, setFormulario] =
    useState(formularioVacio())


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
        gastosResultado,
        serviciosResultado,
        vehiculosResultado
      ] = await Promise.all([

        supabase
          .from('gastos')
          .select(`
            id,
            fecha,
            alcance,
            categoria,
            descripcion,
            importe,
            proveedor,
            metodo_pago,
            referencia,
            servicio_id,
            vehiculo_id,
            notas,
            activo,
            created_at,
            updated_at,

            servicios (
              id,
              folio,

              citas (
                fecha,

                clientes (
                  id,
                  nombre
                ),

                tipos_servicio (
                  id,
                  nombre
                )
              )
            ),

            vehiculos (
              id,
              nombre_unidad,
              placas
            )
          `)
          .eq('activo', true)
          .order(
            'fecha',
            { ascending: false }
          )
          .order(
            'id',
            { ascending: false }
          ),

        supabase
          .from('servicios')
          .select(`
            id,
            folio,
            estado,

            citas (
              fecha,

              clientes (
                id,
                nombre
              ),

              tipos_servicio (
                id,
                nombre
              )
            )
          `)
          .order(
            'id',
            { ascending: false }
          ),

        supabase
          .from('vehiculos')
          .select(`
            id,
            nombre_unidad,
            placas
          `)
          .order(
            'id',
            { ascending: true }
          )
      ])


      if (gastosResultado.error) {
        throw gastosResultado.error
      }

      if (serviciosResultado.error) {
        throw serviciosResultado.error
      }

      if (vehiculosResultado.error) {
        throw vehiculosResultado.error
      }


      setGastos(
        gastosResultado.data || []
      )

      setServicios(
        serviciosResultado.data || []
      )

      setVehiculos(
        vehiculosResultado.data || []
      )

    } catch (error) {

      console.error(
        'Error cargando gastos:',
        error
      )

      setMensaje(
        'No fue posible cargar Gastos. ' +
        'Si es la primera vez que abres este módulo, ejecuta primero el archivo SQL incluido. Detalle: ' +
        error.message
      )

      setGastos([])

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


  function obtenerClienteServicio(
    servicio
  ) {
    return (
      servicio
        ?.citas
        ?.clientes
        ?.nombre ||
      'Cliente'
    )
  }


  function obtenerTipoServicio(
    servicio
  ) {
    return (
      servicio
        ?.citas
        ?.tipos_servicio
        ?.nombre ||
      'Servicio'
    )
  }


  function textoServicio(
    servicio
  ) {
    if (!servicio) {
      return '—'
    }

    return [
      servicio.folio,
      obtenerClienteServicio(servicio),
      obtenerTipoServicio(servicio)
    ]
      .filter(Boolean)
      .join(' · ')
  }


  function textoVehiculo(
    vehiculo
  ) {
    if (!vehiculo) {
      return '—'
    }

    return [
      vehiculo.nombre_unidad,
      vehiculo.placas
    ]
      .filter(Boolean)
      .join(' · ')
  }


  // ==========================================
  // FILTROS
  // ==========================================

  const gastosFiltrados =
    useMemo(
      () => {

        const texto =
          busqueda
            .trim()
            .toLowerCase()

        return gastos.filter(
          gasto => {

            const servicioTexto =
              textoServicio(
                gasto.servicios
              ).toLowerCase()

            const vehiculoTexto =
              textoVehiculo(
                gasto.vehiculos
              ).toLowerCase()

            const coincideTexto =
              !texto ||
              gasto.descripcion
                ?.toLowerCase()
                .includes(texto) ||
              gasto.categoria
                ?.toLowerCase()
                .includes(texto) ||
              gasto.proveedor
                ?.toLowerCase()
                .includes(texto) ||
              gasto.referencia
                ?.toLowerCase()
                .includes(texto) ||
              servicioTexto
                .includes(texto) ||
              vehiculoTexto
                .includes(texto)

            const coincideDesde =
              !fechaDesde ||
              gasto.fecha >=
                fechaDesde

            const coincideHasta =
              !fechaHasta ||
              gasto.fecha <=
                fechaHasta

            const coincideAlcance =
              filtroAlcance ===
                'TODOS' ||
              gasto.alcance ===
                filtroAlcance

            const coincideCategoria =
              filtroCategoria ===
                'TODAS' ||
              gasto.categoria ===
                filtroCategoria

            return (
              coincideTexto &&
              coincideDesde &&
              coincideHasta &&
              coincideAlcance &&
              coincideCategoria
            )
          }
        )
      },
      [
        gastos,
        busqueda,
        fechaDesde,
        fechaHasta,
        filtroAlcance,
        filtroCategoria
      ]
    )


  // ==========================================
  // KPIs
  // ==========================================

  const resumen =
    useMemo(
      () => {

        const hoy =
          new Date()

        const anioActual =
          hoy.getFullYear()

        const mesActual =
          hoy.getMonth()

        const totalPeriodo =
          gastosFiltrados.reduce(
            (
              acumulado,
              gasto
            ) =>
              acumulado +
              Number(
                gasto.importe || 0
              ),
            0
          )

        let totalMes = 0
        let totalAnio = 0

        gastos.forEach(
          gasto => {

            const fecha =
              new Date(
                `${gasto.fecha}T12:00:00`
              )

            const importe =
              Number(
                gasto.importe || 0
              )

            if (
              fecha.getFullYear() ===
              anioActual
            ) {
              totalAnio += importe

              if (
                fecha.getMonth() ===
                mesActual
              ) {
                totalMes += importe
              }
            }
          }
        )

        const servicioPeriodo =
          gastosFiltrados
            .filter(
              gasto =>
                gasto.alcance ===
                'SERVICIO'
            )
            .reduce(
              (
                total,
                gasto
              ) =>
                total +
                Number(
                  gasto.importe || 0
                ),
              0
            )

        const generalPeriodo =
          gastosFiltrados
            .filter(
              gasto =>
                gasto.alcance ===
                'GENERAL'
            )
            .reduce(
              (
                total,
                gasto
              ) =>
                total +
                Number(
                  gasto.importe || 0
                ),
              0
            )

        return {
          totalPeriodo,
          totalMes,
          totalAnio,
          servicioPeriodo,
          generalPeriodo,
          movimientos:
            gastosFiltrados.length
        }
      },
      [
        gastos,
        gastosFiltrados
      ]
    )


  const categoriasResumen =
    useMemo(
      () => {

        const mapa = {}

        gastosFiltrados.forEach(
          gasto => {

            const categoria =
              gasto.categoria ||
              'Sin categoría'

            mapa[categoria] =
              (
                mapa[categoria] ||
                0
              ) +
              Number(
                gasto.importe || 0
              )
          }
        )

        return Object.entries(
          mapa
        )
          .map(
            (
              [
                categoria,
                total
              ]
            ) => ({
              categoria,
              total
            })
          )
          .sort(
            (a, b) =>
              b.total -
              a.total
          )
      },
      [
        gastosFiltrados
      ]
    )


  const maxCategoria =
    categoriasResumen[0]
      ?.total ||
    0


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
        [campo]: valor
      })
    )
  }


  function abrirNuevoGasto() {
    setGastoEditando(null)
    setFormulario(
      formularioVacio()
    )
    setMostrandoFormulario(true)
    setMensaje('')
  }


  function abrirEditarGasto(
    gasto
  ) {
    setGastoEditando(gasto)

    setFormulario({
      fecha:
        gasto.fecha ||
        obtenerFechaLocal(),

      alcance:
        gasto.alcance ||
        'GENERAL',

      categoria:
        gasto.categoria ||
        'Otro',

      descripcion:
        gasto.descripcion ||
        '',

      importe:
        gasto.importe ??
        '',

      proveedor:
        gasto.proveedor ||
        '',

      metodo_pago:
        gasto.metodo_pago ||
        'EFECTIVO',

      referencia:
        gasto.referencia ||
        '',

      servicio_id:
        gasto.servicio_id
          ? String(
              gasto.servicio_id
            )
          : '',

      vehiculo_id:
        gasto.vehiculo_id
          ? String(
              gasto.vehiculo_id
            )
          : '',

      notas:
        gasto.notas ||
        ''
    })

    setMostrandoFormulario(true)
    setMensaje('')
  }


  function cerrarFormulario() {
    if (guardando) {
      return
    }

    setMostrandoFormulario(false)
    setGastoEditando(null)
    setFormulario(
      formularioVacio()
    )
  }


  async function guardarGasto(
    evento
  ) {
    evento.preventDefault()

    if (
      !formulario.fecha
    ) {
      window.alert(
        'Selecciona la fecha del gasto.'
      )
      return
    }

    if (
      !formulario
        .descripcion
        .trim()
    ) {
      window.alert(
        'Escribe una descripción del gasto.'
      )
      return
    }

    if (
      Number(
        formulario.importe
      ) <= 0
    ) {
      window.alert(
        'El importe debe ser mayor a $0.'
      )
      return
    }

    if (
      formulario.alcance ===
        'SERVICIO' &&
      !formulario.servicio_id
    ) {
      window.alert(
        'Selecciona el servicio relacionado con este gasto.'
      )
      return
    }


    const datos = {

      fecha:
        formulario.fecha,

      alcance:
        formulario.alcance,

      categoria:
        formulario.categoria,

      descripcion:
        formulario
          .descripcion
          .trim(),

      importe:
        Number(
          formulario.importe
        ),

      proveedor:
        formulario.proveedor
          .trim() ||
        null,

      metodo_pago:
        formulario.metodo_pago ||
        null,

      referencia:
        formulario.referencia
          .trim() ||
        null,

      servicio_id:
        formulario.alcance ===
          'SERVICIO'
          ? Number(
              formulario.servicio_id
            )
          : null,

      vehiculo_id:
        formulario.vehiculo_id
          ? Number(
              formulario.vehiculo_id
            )
          : null,

      notas:
        formulario.notas
          .trim() ||
        null,

      activo:
        true,

      updated_at:
        new Date()
          .toISOString()
    }


    setGuardando(true)
    setMensaje('')

    try {

      if (gastoEditando) {

        const {
          error
        } =
          await supabase
            .from('gastos')
            .update(datos)
            .eq(
              'id',
              gastoEditando.id
            )

        if (error) {
          throw error
        }

      } else {

        const {
          error
        } =
          await supabase
            .from('gastos')
            .insert(datos)

        if (error) {
          throw error
        }
      }


      cerrarFormulario()
      await cargarTodo()

    } catch (error) {

      console.error(
        'Error guardando gasto:',
        error
      )

      setMensaje(
        'No fue posible guardar el gasto: ' +
        error.message
      )

    } finally {
      setGuardando(false)
    }
  }


  async function eliminarGasto(
    gasto
  ) {

    const confirmar =
      window.confirm(
        `¿Deseas eliminar el gasto "${gasto.descripcion}" por ${formatearMoneda(gasto.importe)}?`
      )

    if (!confirmar) {
      return
    }

    try {

      const {
        error
      } =
        await supabase
          .from('gastos')
          .update({
            activo: false,
            updated_at:
              new Date()
                .toISOString()
          })
          .eq(
            'id',
            gasto.id
          )

      if (error) {
        throw error
      }

      await cargarTodo()

    } catch (error) {

      console.error(
        'Error eliminando gasto:',
        error
      )

      window.alert(
        'No fue posible eliminar el gasto: ' +
        error.message
      )
    }
  }


  // ==========================================
  // PERIODOS RAPIDOS
  // ==========================================

  function aplicarMesActual() {
    setFechaDesde(
      obtenerInicioMes()
    )
    setFechaHasta(
      obtenerFechaLocal()
    )
  }


  function aplicarAnioActual() {
    const hoy =
      new Date()

    setFechaDesde(
      `${hoy.getFullYear()}-01-01`
    )

    setFechaHasta(
      obtenerFechaLocal()
    )
  }


  function aplicarHistorico() {
    setFechaDesde('')
    setFechaHasta('')
  }


  // ==========================================
  // CSV
  // ==========================================

  function exportarCsv() {

    if (
      gastosFiltrados.length ===
      0
    ) {
      window.alert(
        'No hay gastos para exportar con los filtros actuales.'
      )
      return
    }

    const filas = [
      [
        'Fecha',
        'Alcance',
        'Categoria',
        'Descripcion',
        'Importe',
        'Proveedor',
        'Metodo de pago',
        'Referencia',
        'Servicio',
        'Vehiculo',
        'Notas'
      ]
    ]


    gastosFiltrados.forEach(
      gasto => {

        filas.push([
          gasto.fecha || '',
          gasto.alcance || '',
          gasto.categoria || '',
          gasto.descripcion || '',
          Number(
            gasto.importe || 0
          ).toFixed(2),
          gasto.proveedor || '',
          gasto.metodo_pago || '',
          gasto.referencia || '',
          textoServicio(
            gasto.servicios
          ),
          textoVehiculo(
            gasto.vehiculos
          ),
          gasto.notas || ''
        ])
      }
    )


    const escapar =
      valor =>
        `"${String(valor)
          .replaceAll(
            '"',
            '""'
          )}"`


    const contenido =
      filas
        .map(
          fila =>
            fila
              .map(escapar)
              .join(',')
        )
        .join('\n')


    const blob =
      new Blob(
        [
          '\uFEFF' +
          contenido
        ],
        {
          type:
            'text/csv;charset=utf-8;'
        }
      )


    const url =
      URL.createObjectURL(
        blob
      )


    const enlace =
      document.createElement(
        'a'
      )

    enlace.href =
      url

    enlace.download =
      `gastos-destapa-ya-${obtenerFechaLocal()}.csv`

    document.body.appendChild(
      enlace
    )

    enlace.click()
    enlace.remove()

    URL.revokeObjectURL(
      url
    )
  }


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="gas-page">

      <header className="gas-header">

        <div>

          <button
            type="button"
            className="gas-back"
            onClick={onVolver}
          >
            ← Volver al Dashboard
          </button>

          <span className="gas-eyebrow">
            ADMINISTRACIÓN
          </span>

          <h1>
            Gastos
          </h1>

          <p>
            Control de gastos generales y gastos asociados a cada servicio.
          </p>

        </div>


        <div className="gas-header-actions">

          <button
            type="button"
            className="gas-secondary-button"
            onClick={
              exportarCsv
            }
          >
            ↓ Exportar CSV
          </button>

          <button
            type="button"
            className="gas-primary-button"
            onClick={
              abrirNuevoGasto
            }
          >
            ＋ Nuevo gasto
          </button>

        </div>

      </header>


      <main className="gas-content">

        {
          mensaje && (
            <div className="gas-message">
              {mensaje}
            </div>
          )
        }


        {/* KPIs */}

        <section className="gas-kpis">

          <article className="gas-kpi gas-kpi-main">
            <span>
              Gasto del periodo
            </span>
            <strong>
              {
                formatearMoneda(
                  resumen.totalPeriodo
                )
              }
            </strong>
            <small>
              {
                resumen.movimientos
              } movimientos
            </small>
          </article>


          <article className="gas-kpi">
            <span>
              Este mes
            </span>
            <strong>
              {
                formatearMoneda(
                  resumen.totalMes
                )
              }
            </strong>
            <small>
              Mes actual
            </small>
          </article>


          <article className="gas-kpi">
            <span>
              Acumulado anual
            </span>
            <strong>
              {
                formatearMoneda(
                  resumen.totalAnio
                )
              }
            </strong>
            <small>
              Año actual
            </small>
          </article>


          <article className="gas-kpi">
            <span>
              Ligados a servicios
            </span>
            <strong>
              {
                formatearMoneda(
                  resumen.servicioPeriodo
                )
              }
            </strong>
            <small>
              Periodo seleccionado
            </small>
          </article>


          <article className="gas-kpi">
            <span>
              Gastos generales
            </span>
            <strong>
              {
                formatearMoneda(
                  resumen.generalPeriodo
                )
              }
            </strong>
            <small>
              Periodo seleccionado
            </small>
          </article>

        </section>


        {/* FILTROS */}

        <section className="gas-filter-card">

          <div className="gas-quick-periods">

            <button
              type="button"
              onClick={
                aplicarMesActual
              }
            >
              Este mes
            </button>

            <button
              type="button"
              onClick={
                aplicarAnioActual
              }
            >
              Este año
            </button>

            <button
              type="button"
              onClick={
                aplicarHistorico
              }
            >
              Histórico
            </button>

          </div>


          <div className="gas-filter-grid">

            <label className="gas-search">
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
                placeholder="Descripción, proveedor, folio, vehículo..."
              />
            </label>


            <label>
              <span>
                Desde
              </span>

              <input
                type="date"
                value={
                  fechaDesde
                }
                onChange={
                  evento =>
                    setFechaDesde(
                      evento.target.value
                    )
                }
              />
            </label>


            <label>
              <span>
                Hasta
              </span>

              <input
                type="date"
                value={
                  fechaHasta
                }
                onChange={
                  evento =>
                    setFechaHasta(
                      evento.target.value
                    )
                }
              />
            </label>


            <label>
              <span>
                Tipo
              </span>

              <select
                value={
                  filtroAlcance
                }
                onChange={
                  evento =>
                    setFiltroAlcance(
                      evento.target.value
                    )
                }
              >
                <option value="TODOS">
                  Todos
                </option>

                <option value="GENERAL">
                  General
                </option>

                <option value="SERVICIO">
                  Por servicio
                </option>
              </select>
            </label>


            <label>
              <span>
                Categoría
              </span>

              <select
                value={
                  filtroCategoria
                }
                onChange={
                  evento =>
                    setFiltroCategoria(
                      evento.target.value
                    )
                }
              >
                <option value="TODAS">
                  Todas
                </option>

                {
                  CATEGORIAS.map(
                    categoria => (
                      <option
                        key={
                          categoria
                        }
                        value={
                          categoria
                        }
                      >
                        {categoria}
                      </option>
                    )
                  )
                }
              </select>
            </label>

          </div>

        </section>


        {/* CUERPO */}

        <section className="gas-dashboard-grid">

          <article className="gas-panel gas-category-panel">

            <div className="gas-panel-header">

              <div>
                <h2>
                  Gastos por categoría
                </h2>
                <p>
                  Distribución del periodo seleccionado
                </p>
              </div>

            </div>


            {
              categoriasResumen.length ===
                0
                ? (
                  <div className="gas-empty-small">
                    Sin datos para el periodo.
                  </div>
                )
                : (
                  <div className="gas-category-list">

                    {
                      categoriasResumen
                        .slice(
                          0,
                          8
                        )
                        .map(
                          item => {

                            const porcentaje =
                              maxCategoria >
                                0
                                ? (
                                  item.total /
                                  maxCategoria
                                ) *
                                  100
                                : 0

                            return (
                              <div
                                className="gas-category-row"
                                key={
                                  item.categoria
                                }
                              >

                                <div className="gas-category-top">

                                  <span>
                                    {
                                      item.categoria
                                    }
                                  </span>

                                  <strong>
                                    {
                                      formatearMoneda(
                                        item.total
                                      )
                                    }
                                  </strong>

                                </div>

                                <div className="gas-bar">

                                  <span
                                    style={{
                                      width:
                                        `${porcentaje}%`
                                    }}
                                  />

                                </div>

                              </div>
                            )
                          }
                        )
                    }

                  </div>
                )
            }

          </article>


          <article className="gas-panel gas-list-panel">

            <div className="gas-panel-header">

              <div>
                <h2>
                  Movimientos
                </h2>

                <p>
                  {
                    gastosFiltrados
                      .length
                  } gastos encontrados
                </p>
              </div>


              <button
                type="button"
                className="gas-refresh"
                onClick={
                  cargarTodo
                }
              >
                ↻ Actualizar
              </button>

            </div>


            {
              cargando
                ? (
                  <div className="gas-empty">
                    Cargando gastos...
                  </div>
                )
                : gastosFiltrados
                    .length === 0
                  ? (
                    <div className="gas-empty">
                      <div>
                        💳
                      </div>

                      <h3>
                        Sin gastos registrados
                      </h3>

                      <p>
                        Registra el primer gasto o cambia los filtros.
                      </p>
                    </div>
                  )
                  : (
                    <div className="gas-table-wrap">

                      <table className="gas-table">

                        <thead>
                          <tr>
                            <th>
                              Fecha
                            </th>

                            <th>
                              Gasto
                            </th>

                            <th>
                              Tipo / relación
                            </th>

                            <th>
                              Pago
                            </th>

                            <th>
                              Importe
                            </th>

                            <th>
                            </th>
                          </tr>
                        </thead>


                        <tbody>

                          {
                            gastosFiltrados.map(
                              gasto => (

                                <tr
                                  key={
                                    gasto.id
                                  }
                                >

                                  <td>
                                    {
                                      formatearFecha(
                                        gasto.fecha
                                      )
                                    }
                                  </td>


                                  <td>

                                    <strong className="gas-description">
                                      {
                                        gasto.descripcion
                                      }
                                    </strong>

                                    <span className="gas-category-tag">
                                      {
                                        gasto.categoria
                                      }
                                    </span>

                                    {
                                      gasto.proveedor && (
                                        <small>
                                          {
                                            gasto.proveedor
                                          }
                                        </small>
                                      )
                                    }

                                  </td>


                                  <td>

                                    <span
                                      className={
                                        `gas-type ${
                                          gasto.alcance ===
                                            'SERVICIO'
                                            ? 'service'
                                            : 'general'
                                        }`
                                      }
                                    >
                                      {
                                        gasto.alcance ===
                                          'SERVICIO'
                                          ? 'POR SERVICIO'
                                          : 'GENERAL'
                                      }
                                    </span>


                                    {
                                      gasto.alcance ===
                                        'SERVICIO' && (
                                        <small>
                                          {
                                            textoServicio(
                                              gasto.servicios
                                            )
                                          }
                                        </small>
                                      )
                                    }


                                    {
                                      gasto.vehiculos && (
                                        <small>
                                          🚐 {
                                            textoVehiculo(
                                              gasto.vehiculos
                                            )
                                          }
                                        </small>
                                      )
                                    }

                                  </td>


                                  <td>

                                    <strong>
                                      {
                                        gasto.metodo_pago ||
                                        '—'
                                      }
                                    </strong>

                                    {
                                      gasto.referencia && (
                                        <small>
                                          Ref. {
                                            gasto.referencia
                                          }
                                        </small>
                                      )
                                    }

                                  </td>


                                  <td className="gas-amount">
                                    {
                                      formatearMoneda(
                                        gasto.importe
                                      )
                                    }
                                  </td>


                                  <td>

                                    <div className="gas-row-actions">

                                      <button
                                        type="button"
                                        onClick={() =>
                                          abrirEditarGasto(
                                            gasto
                                          )
                                        }
                                      >
                                        Editar
                                      </button>

                                      <button
                                        type="button"
                                        className="danger"
                                        onClick={() =>
                                          eliminarGasto(
                                            gasto
                                          )
                                        }
                                      >
                                        Eliminar
                                      </button>

                                    </div>

                                  </td>

                                </tr>

                              )
                            )
                          }

                        </tbody>

                      </table>

                    </div>
                  )
            }

          </article>

        </section>

      </main>


      {/* MODAL */}

      {
        mostrandoFormulario && (

          <div
            className="gas-modal-overlay"
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

            <div className="gas-modal">

              <header className="gas-modal-header">

                <div>
                  <span>
                    {
                      gastoEditando
                        ? 'EDITAR MOVIMIENTO'
                        : 'NUEVO MOVIMIENTO'
                    }
                  </span>

                  <h2>
                    {
                      gastoEditando
                        ? 'Editar gasto'
                        : 'Registrar gasto'
                    }
                  </h2>

                  <p>
                    Los gastos asociados a un servicio podrán utilizarse posteriormente para calcular la utilidad real por trabajo.
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
                className="gas-form"
                onSubmit={
                  guardarGasto
                }
              >

                <div className="gas-form-grid">

                  <label>
                    <span>
                      Fecha *
                    </span>

                    <input
                      type="date"
                      value={
                        formulario.fecha
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'fecha',
                            evento.target.value
                          )
                      }
                      required
                    />
                  </label>


                  <label>
                    <span>
                      Tipo de gasto *
                    </span>

                    <select
                      value={
                        formulario.alcance
                      }
                      onChange={
                        evento => {

                          const valor =
                            evento.target.value

                          setFormulario(
                            anterior => ({
                              ...anterior,
                              alcance:
                                valor,
                              servicio_id:
                                valor ===
                                  'SERVICIO'
                                  ? anterior.servicio_id
                                  : ''
                            })
                          )
                        }
                      }
                    >
                      <option value="GENERAL">
                        Gasto general
                      </option>

                      <option value="SERVICIO">
                        Gasto de un servicio
                      </option>
                    </select>
                  </label>


                  <label>
                    <span>
                      Categoría *
                    </span>

                    <select
                      value={
                        formulario.categoria
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'categoria',
                            evento.target.value
                          )
                      }
                    >
                      {
                        CATEGORIAS.map(
                          categoria => (
                            <option
                              key={
                                categoria
                              }
                              value={
                                categoria
                              }
                            >
                              {categoria}
                            </option>
                          )
                        )
                      }
                    </select>
                  </label>


                  <label>
                    <span>
                      Importe *
                    </span>

                    <div className="gas-money-input">
                      <span>
                        $
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          formulario.importe
                        }
                        onChange={
                          evento =>
                            cambiarCampo(
                              'importe',
                              evento.target.value
                            )
                        }
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </label>


                  <label className="full">
                    <span>
                      Descripción *
                    </span>

                    <input
                      type="text"
                      value={
                        formulario.descripcion
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'descripcion',
                            evento.target.value
                          )
                      }
                      placeholder="Ej. Gasolina para unidad, compra de cable, publicidad..."
                      required
                    />
                  </label>


                  {
                    formulario.alcance ===
                      'SERVICIO' && (

                      <label className="full">
                        <span>
                          Servicio relacionado *
                        </span>

                        <select
                          value={
                            formulario.servicio_id
                          }
                          onChange={
                            evento =>
                              cambiarCampo(
                                'servicio_id',
                                evento.target.value
                              )
                          }
                          required
                        >
                          <option value="">
                            Selecciona el servicio...
                          </option>

                          {
                            servicios.map(
                              servicio => (
                                <option
                                  key={
                                    servicio.id
                                  }
                                  value={
                                    servicio.id
                                  }
                                >
                                  {
                                    textoServicio(
                                      servicio
                                    )
                                  }
                                </option>
                              )
                            )
                          }
                        </select>
                      </label>
                    )
                  }


                  <label>
                    <span>
                      Vehículo / unidad
                    </span>

                    <select
                      value={
                        formulario.vehiculo_id
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'vehiculo_id',
                            evento.target.value
                          )
                      }
                    >
                      <option value="">
                        Sin asignar
                      </option>

                      {
                        vehiculos.map(
                          vehiculo => (
                            <option
                              key={
                                vehiculo.id
                              }
                              value={
                                vehiculo.id
                              }
                            >
                              {
                                textoVehiculo(
                                  vehiculo
                                )
                              }
                            </option>
                          )
                        )
                      }
                    </select>
                  </label>


                  <label>
                    <span>
                      Proveedor
                    </span>

                    <input
                      type="text"
                      value={
                        formulario.proveedor
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'proveedor',
                            evento.target.value
                          )
                      }
                      placeholder="Nombre del proveedor"
                    />
                  </label>


                  <label>
                    <span>
                      Método de pago
                    </span>

                    <select
                      value={
                        formulario.metodo_pago
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'metodo_pago',
                            evento.target.value
                          )
                      }
                    >
                      {
                        METODOS_PAGO.map(
                          metodo => (
                            <option
                              key={
                                metodo
                              }
                              value={
                                metodo
                              }
                            >
                              {metodo}
                            </option>
                          )
                        )
                      }
                    </select>
                  </label>


                  <label>
                    <span>
                      Referencia
                    </span>

                    <input
                      type="text"
                      value={
                        formulario.referencia
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'referencia',
                            evento.target.value
                          )
                      }
                      placeholder="Ticket, transferencia, factura..."
                    />
                  </label>


                  <label className="full">
                    <span>
                      Notas
                    </span>

                    <textarea
                      rows="3"
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
                      placeholder="Información adicional..."
                    />
                  </label>

                </div>


                <div className="gas-form-actions">

                  <button
                    type="button"
                    className="gas-cancel"
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
                    className="gas-save"
                    disabled={
                      guardando
                    }
                  >
                    {
                      guardando
                        ? 'Guardando...'
                        : gastoEditando
                          ? 'Guardar cambios'
                          : 'Registrar gasto'
                    }
                  </button>

                </div>

              </form>

            </div>

          </div>

        )
      }

    </div>
  )
}


export default Gastos