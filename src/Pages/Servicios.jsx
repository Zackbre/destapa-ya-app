import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { supabase } from '../supabase'

import {
  verReporteServicio,
  descargarReporteServicio
} from '../utils/generarReporteServicio'

import './Servicios.css'


function Servicios({
  perfil,
  onVolver,
  servicioInicialId = null
}) {

  const [
    servicios,
    setServicios
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
    busqueda,
    setBusqueda
  ] = useState('')

  const [
    filtroEstado,
    setFiltroEstado
  ] = useState('TODOS')

  const [
    fechaDesde,
    setFechaDesde
  ] = useState('')

  const [
    fechaHasta,
    setFechaHasta
  ] = useState('')

  const [
    servicioSeleccionado,
    setServicioSeleccionado
  ] = useState(null)

  const [
    detalleServicio,
    setDetalleServicio
  ] = useState(null)

  const [
    cargandoDetalle,
    setCargandoDetalle
  ] = useState(false)

  const [
    generandoPdf,
    setGenerandoPdf
  ] = useState(false)

  const servicioInicialAbierto =
    useRef(null)


  // ==========================================
  // CARGAR
  // ==========================================

  useEffect(() => {

    cargarServicios()

  }, [])


  // ==========================================
  // ABRIR SERVICIO RECIBIDO DESDE CLIENTES
  // ==========================================

  useEffect(() => {

    if (
      !servicioInicialId ||
      servicios.length === 0
    ) {
      return
    }


    if (
      Number(
        servicioInicialAbierto.current
      ) ===
      Number(
        servicioInicialId
      )
    ) {
      return
    }


    const servicio =
      servicios.find(
        item =>
          Number(item.id) ===
          Number(servicioInicialId)
      )


    if (!servicio) {

      setMensaje(
        'No fue posible localizar el servicio solicitado.'
      )

      return
    }


    servicioInicialAbierto.current =
      servicioInicialId


    abrirExpediente(
      servicio
    )

  }, [
    servicios,
    servicioInicialId
  ])


  // ==========================================
  // CARGAR SERVICIOS
  // ==========================================

  async function cargarServicios() {

    setCargando(true)
    setMensaje('')

    try {

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
            cliente_id,
            direccion_id,
            tipo_servicio_id,
            vehiculo_id,
            problema_reportado,
            diagnostico,
            trabajo_realizado,
            recomendaciones,
            estado,
            fecha_inicio,
            fecha_conclusion,
            confirmado_admin,
            fecha_confirmacion_admin,
            confirmado_por,
            observacion_admin,

            citas (
              id,
              fecha,
              hora_estimada,
              descripcion_problema,
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
                estado,
                codigo_postal,
                referencias
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
            ),

            servicios_tecnicos (
              id,
              tecnico_id,

              perfiles (
                id,
                nombre
              )
            ),

            pagos (
              id,
              importe,
              estatus,
              metodo_pago_id,

              metodos_pago (
                id,
                nombre
              )
            )
          `)
          .order(
            'id',
            {
              ascending: false
            }
          )


      if (error) {
        throw error
      }


      setServicios(
        data || []
      )


    } catch (error) {

      console.error(
        'Error cargando servicios:',
        error
      )

      setMensaje(
        'No fue posible cargar el historial de servicios: ' +
        error.message
      )

      setServicios([])

    } finally {

      setCargando(false)
    }
  }


  // ==========================================
  // MONEDA
  // ==========================================

  function formatearMoneda(valor) {

    return new Intl.NumberFormat(
      'es-MX',
      {
        style:
          'currency',

        currency:
          'MXN'
      }
    ).format(
      Number(
        valor || 0
      )
    )
  }


  // ==========================================
  // FECHA
  // ==========================================

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


  // ==========================================
  // FECHA HORA
  // ==========================================

  function formatearFechaHora(valor) {

    if (!valor) {
      return '—'
    }

    return new Date(
      valor
    ).toLocaleString(
      'es-MX',
      {
        dateStyle:
          'medium',

        timeStyle:
          'short'
      }
    )
  }


  // ==========================================
  // DIRECCION
  // ==========================================

  function obtenerDireccion(
    servicio
  ) {

    const direccion =
      servicio
        ?.citas
        ?.direcciones_cliente

    if (!direccion) {
      return '—'
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
  // TECNICO
  // ==========================================

  function obtenerTecnicos(
    servicio
  ) {

    const registros =
      servicio
        ?.servicios_tecnicos ||
      []

    if (
      registros.length === 0
    ) {
      return 'Sin técnico'
    }

    const nombres =
      registros
        .map(
          (item) =>
            item
              ?.perfiles
              ?.nombre
        )
        .filter(Boolean)

    return (
      nombres.join(', ') ||
      'Sin técnico'
    )
  }


  // ==========================================
  // PAGO
  // ==========================================

  function obtenerPago(
    servicio
  ) {

    const pagos =
      servicio
        ?.pagos ||
      []

    return (
      pagos.find(
        (item) =>
          item.estatus ===
          'PAGADO'
      ) ||
      pagos[0] ||
      null
    )
  }


  // ==========================================
  // ESTADO VISUAL
  // ==========================================

  function claseEstado(
    servicio
  ) {

    if (
      servicio
        ?.confirmado_admin === true
    ) {
      return 'confirmado'
    }

    switch (
      servicio?.estado
    ) {

      case 'EN_PROCESO':
        return 'proceso'

      case 'CONCLUIDO':
        return 'concluido'

      case 'CANCELADO':
        return 'cancelado'

      default:
        return 'otro'
    }
  }


  function textoEstado(
    servicio
  ) {

    if (
      servicio
        ?.confirmado_admin === true
    ) {
      return 'CONFIRMADO'
    }

    return (
      servicio
        ?.estado
        ?.replaceAll(
          '_',
          ' '
        ) ||
      '—'
    )
  }


  // ==========================================
  // FILTROS
  // ==========================================

  const serviciosFiltrados =
    useMemo(
      () => {

        const texto =
          busqueda
            .trim()
            .toLowerCase()

        return servicios.filter(
          (servicio) => {

            const folio =
              servicio
                ?.folio
                ?.toLowerCase() ||
              ''

            const cliente =
              servicio
                ?.citas
                ?.clientes
                ?.nombre
                ?.toLowerCase() ||
              ''

            const telefono =
              servicio
                ?.citas
                ?.clientes
                ?.telefono ||
              ''

            const estadoTexto =
              textoEstado(
                servicio
              )

            const coincideBusqueda =
              !texto ||
              folio.includes(
                texto
              ) ||
              cliente.includes(
                texto
              ) ||
              telefono.includes(
                texto
              )

            const coincideEstado =
              filtroEstado ===
                'TODOS' ||

              (
                filtroEstado ===
                  'CONFIRMADO' &&
                servicio
                  ?.confirmado_admin ===
                  true
              ) ||

              (
                filtroEstado !==
                  'CONFIRMADO' &&
                estadoTexto ===
                  filtroEstado
              )

            const fecha =
              servicio
                ?.citas
                ?.fecha

            const coincideDesde =
              !fechaDesde ||
              (
                fecha &&
                fecha >=
                  fechaDesde
              )

            const coincideHasta =
              !fechaHasta ||
              (
                fecha &&
                fecha <=
                  fechaHasta
              )

            return (
              coincideBusqueda &&
              coincideEstado &&
              coincideDesde &&
              coincideHasta
            )
          }
        )

      },
      [
        servicios,
        busqueda,
        filtroEstado,
        fechaDesde,
        fechaHasta
      ]
    )


  // ==========================================
  // KPIS
  // ==========================================

  const resumen =
    useMemo(
      () => {

        return {

          total:
            servicios.length,

          enProceso:
            servicios.filter(
              (item) =>
                item.estado ===
                  'EN_PROCESO'
            ).length,

          concluidos:
            servicios.filter(
              (item) =>
                item.estado ===
                  'CONCLUIDO' &&
                item.confirmado_admin !==
                  true
            ).length,

          confirmados:
            servicios.filter(
              (item) =>
                item.confirmado_admin ===
                  true
            ).length

        }

      },
      [
        servicios
      ]
    )


  // ==========================================
  // ABRIR EXPEDIENTE
  // ==========================================

  async function abrirExpediente(
    servicio
  ) {

    setServicioSeleccionado(
      servicio
    )

    setDetalleServicio(null)
    setCargandoDetalle(true)
    setMensaje('')

    try {

      const [
        herramientasResultado,
        pagosResultado,
        evidenciasResultado
      ] =
        await Promise.all([

          supabase
            .from(
              'servicios_herramientas'
            )
            .select(`
              id,
              herramienta_id,
              observaciones,

              herramientas (
                id,
                nombre,
                descripcion
              )
            `)
            .eq(
              'servicio_id',
              servicio.id
            ),

          supabase
            .from('pagos')
            .select(`
              id,
              servicio_id,
              metodo_pago_id,
              importe,
              estatus,
              referencia,
              created_at,

              metodos_pago (
                id,
                nombre
              )
            `)
            .eq(
              'servicio_id',
              servicio.id
            )
            .order(
              'id',
              {
                ascending:
                  false
              }
            ),

          supabase
            .from('evidencias')
            .select(`
              id,
              servicio_id,
              tipo,
              archivo_url,
              descripcion,
              tomado_por
            `)
            .eq(
              'servicio_id',
              servicio.id
            )
            .order(
              'id',
              {
                ascending:
                  true
              }
            )
        ])


      if (
        herramientasResultado.error
      ) {
        throw herramientasResultado.error
      }


      if (
        pagosResultado.error
      ) {
        throw pagosResultado.error
      }


      if (
        evidenciasResultado.error
      ) {
        throw evidenciasResultado.error
      }


      const evidenciasConImagen =
        await cargarImagenesPrivadas(
          evidenciasResultado.data ||
          []
        )


      setDetalleServicio({

        herramientas:
          herramientasResultado.data ||
          [],

        pagos:
          pagosResultado.data ||
          [],

        evidencias:
          evidenciasConImagen
      })


    } catch (error) {

      console.error(
        'Error cargando expediente:',
        error
      )

      setMensaje(
        'No fue posible cargar el expediente: ' +
        error.message
      )

    } finally {

      setCargandoDetalle(false)
    }
  }


  // ==========================================
  // FOTOS PRIVADAS
  // ==========================================

  async function cargarImagenesPrivadas(
    registros
  ) {

    if (
      registros.length === 0
    ) {
      return []
    }


    const {
      data
    } =
      await supabase.auth.getSession()


    const token =
      data
        ?.session
        ?.access_token


    if (!token) {

      return registros.map(
        (item) => ({
          ...item,
          preview_url:
            null
        })
      )
    }


    const resultados =
      await Promise.all(

        registros.map(
          async (
            evidencia
          ) => {

            try {

              const respuesta =
                await fetch(
                  evidencia
                    .archivo_url,
                  {
                    headers: {
                      Authorization:
                        `Bearer ${token}`
                    }
                  }
                )


              if (
                !respuesta.ok
              ) {

                return {
                  ...evidencia,
                  preview_url:
                    null
                }
              }


              const blob =
                await respuesta.blob()


              return {

                ...evidencia,

                preview_url:
                  URL.createObjectURL(
                    blob
                  )
              }


            } catch (
              error
            ) {

              console.error(
                'Error cargando imagen:',
                error
              )


              return {

                ...evidencia,

                preview_url:
                  null
              }
            }
          }
        )
      )


    return resultados
  }


  // ==========================================
  // CERRAR EXPEDIENTE
  // ==========================================

  function cerrarExpediente() {

    const evidenciasActuales =
      detalleServicio
        ?.evidencias ||
      []

    evidenciasActuales.forEach(
      (
        evidencia
      ) => {

        if (
          evidencia.preview_url
        ) {

          URL.revokeObjectURL(
            evidencia.preview_url
          )
        }
      }
    )

    setServicioSeleccionado(
      null
    )

    setDetalleServicio(
      null
    )
  }


  // ==========================================
  // EVIDENCIAS POR TIPO
  // ==========================================

  function obtenerEvidenciasTipo(
    tipo
  ) {

    return (
      detalleServicio
        ?.evidencias ||
      []
    ).filter(
      (
        evidencia
      ) =>
        evidencia.tipo ===
        tipo
    )
  }


  // ==========================================
  // VER PDF
  // ==========================================

  async function verPdf() {

    if (
      !servicioSeleccionado ||
      !detalleServicio
    ) {
      return
    }

    setGenerandoPdf(true)

    try {

      await verReporteServicio({

        servicio:
          servicioSeleccionado,

        detalleServicio
      })

    } catch (error) {

      console.error(
        'Error generando PDF:',
        error
      )

      window.alert(
        'No fue posible generar el PDF: ' +
        error.message
      )

    } finally {

      setGenerandoPdf(false)
    }
  }


  // ==========================================
  // DESCARGAR PDF
  // ==========================================

  async function descargarPdf() {

    if (
      !servicioSeleccionado ||
      !detalleServicio
    ) {
      return
    }

    setGenerandoPdf(true)

    try {

      await descargarReporteServicio({

        servicio:
          servicioSeleccionado,

        detalleServicio
      })

    } catch (error) {

      console.error(
        'Error descargando PDF:',
        error
      )

      window.alert(
        'No fue posible generar el PDF: ' +
        error.message
      )

    } finally {

      setGenerandoPdf(false)
    }
  }


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (

    <div className="srv-page">


      {/* ======================================
          HEADER
      ====================================== */}

      <header className="srv-header">

        <div>

          <button
            type="button"
            className="srv-back"
            onClick={
              onVolver
            }
          >
            ← Volver al Dashboard
          </button>

          <span className="srv-eyebrow">
            OPERACIÓN
          </span>

          <h1>
            Servicios
          </h1>

          <p>
            Historial general de servicios de DESTAPA YA
          </p>

        </div>


        <div className="srv-brand">
          DY
        </div>

      </header>


      <main className="srv-content">


        {/* ======================================
            RESUMEN
        ====================================== */}

        <section className="srv-kpis">

          <div className="srv-kpi">

            <span>
              Total
            </span>

            <strong>
              {resumen.total}
            </strong>

          </div>


          <div className="srv-kpi">

            <span>
              En proceso
            </span>

            <strong>
              {resumen.enProceso}
            </strong>

          </div>


          <div className="srv-kpi">

            <span>
              Por confirmar
            </span>

            <strong>
              {resumen.concluidos}
            </strong>

          </div>


          <div className="srv-kpi highlight">

            <span>
              Confirmados
            </span>

            <strong>
              {resumen.confirmados}
            </strong>

          </div>

        </section>


        {/* ======================================
            FILTROS
        ====================================== */}

        <section className="srv-filter-card">

          <div className="srv-search">

            <span>
              🔎
            </span>

            <input
              type="text"
              value={
                busqueda
              }
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Buscar por folio, cliente o teléfono..."
            />

          </div>


          <div className="srv-filters">

            <div>

              <label>
                Estado
              </label>

              <select
                value={
                  filtroEstado
                }
                onChange={(e) =>
                  setFiltroEstado(
                    e.target.value
                  )
                }
              >

                <option value="TODOS">
                  Todos
                </option>

                <option value="EN_PROCESO">
                  En proceso
                </option>

                <option value="CONCLUIDO">
                  Por confirmar
                </option>

                <option value="CONFIRMADO">
                  Confirmados
                </option>

              </select>

            </div>


            <div>

              <label>
                Desde
              </label>

              <input
                type="date"
                value={
                  fechaDesde
                }
                onChange={(e) =>
                  setFechaDesde(
                    e.target.value
                  )
                }
              />

            </div>


            <div>

              <label>
                Hasta
              </label>

              <input
                type="date"
                value={
                  fechaHasta
                }
                onChange={(e) =>
                  setFechaHasta(
                    e.target.value
                  )
                }
              />

            </div>


            <button
              type="button"
              className="srv-clear"
              onClick={() => {

                setBusqueda('')
                setFiltroEstado('TODOS')
                setFechaDesde('')
                setFechaHasta('')

              }}
            >
              Limpiar filtros
            </button>

          </div>

        </section>


        {
          mensaje && (

            <div className="srv-error">
              {mensaje}
            </div>

          )
        }


        {/* ======================================
            LISTADO
        ====================================== */}

        <section className="srv-list-card">

          <div className="srv-list-header">

            <div>

              <h2>
                Historial
              </h2>

              <p>
                {
                  serviciosFiltrados.length
                } servicios encontrados
              </p>

            </div>


            <button
              type="button"
              className="srv-refresh"
              onClick={
                cargarServicios
              }
            >
              ↻ Actualizar
            </button>

          </div>


          {
            cargando
              ? (

                <div className="srv-empty">
                  Cargando servicios...
                </div>

              )

              : serviciosFiltrados
                  .length === 0
                ? (

                  <div className="srv-empty">

                    <div>
                      🔧
                    </div>

                    <h3>
                      No se encontraron servicios
                    </h3>

                    <p>
                      Cambia los filtros o realiza una nueva búsqueda.
                    </p>

                  </div>

                )

                : (

                  <div className="srv-table-wrap">

                    <table className="srv-table">

                      <thead>

                        <tr>

                          <th>
                            Servicio
                          </th>

                          <th>
                            Cliente
                          </th>

                          <th>
                            Técnico
                          </th>

                          <th>
                            Fecha
                          </th>

                          <th>
                            Estado
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
                          serviciosFiltrados.map(
                            (
                              servicio
                            ) => {

                              const pago =
                                obtenerPago(
                                  servicio
                                )

                              return (

                                <tr
                                  key={
                                    servicio.id
                                  }
                                >

                                  <td>

                                    <strong className="srv-folio">

                                      {
                                        servicio.folio
                                      }

                                    </strong>

                                    <span className="srv-type">

                                      {
                                        servicio
                                          ?.citas
                                          ?.tipos_servicio
                                          ?.nombre ||
                                        'Servicio'
                                      }

                                    </span>

                                  </td>


                                  <td>

                                    <strong>

                                      {
                                        servicio
                                          ?.citas
                                          ?.clientes
                                          ?.nombre ||
                                        '—'
                                      }

                                    </strong>

                                    <span>

                                      {
                                        servicio
                                          ?.citas
                                          ?.clientes
                                          ?.telefono ||
                                        ''
                                      }

                                    </span>

                                  </td>


                                  <td>

                                    {
                                      obtenerTecnicos(
                                        servicio
                                      )
                                    }

                                  </td>


                                  <td>

                                    {
                                      formatearFecha(
                                        servicio
                                          ?.citas
                                          ?.fecha
                                      )
                                    }

                                  </td>


                                  <td>

                                    <span
                                      className={
                                        `srv-status ${
                                          claseEstado(
                                            servicio
                                          )
                                        }`
                                      }
                                    >

                                      {
                                        textoEstado(
                                          servicio
                                        )
                                      }

                                    </span>

                                  </td>


                                  <td>

                                    <strong>

                                      {
                                        pago
                                          ? formatearMoneda(
                                              pago.importe
                                            )
                                          : '—'
                                      }

                                    </strong>

                                  </td>


                                  <td>

                                    <button
                                      type="button"
                                      className="srv-view"
                                      onClick={() =>
                                        abrirExpediente(
                                          servicio
                                        )
                                      }
                                    >
                                      Ver expediente
                                    </button>

                                  </td>

                                </tr>

                              )
                            }
                          )
                        }

                      </tbody>

                    </table>

                  </div>

                )
          }

        </section>

      </main>


      {/* ======================================
          MODAL EXPEDIENTE
      ====================================== */}

      {
        servicioSeleccionado && (

          <div className="srv-modal-overlay">

            <div className="srv-modal">


              <header className="srv-modal-header">

                <div>

                  <span>
                    EXPEDIENTE DE SERVICIO
                  </span>

                  <h2>
                    {
                      servicioSeleccionado.folio
                    }
                  </h2>

                  <p>
                    {
                      textoEstado(
                        servicioSeleccionado
                      )
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


              <div className="srv-modal-content">


                {
                  cargandoDetalle
                    ? (

                      <div className="srv-modal-loading">
                        Cargando expediente...
                      </div>

                    )

                    : detalleServicio && (

                      <>


                        {/* DATOS GENERALES */}

                        <section className="srv-detail-card">

                          <h3>
                            Datos generales
                          </h3>

                          <div className="srv-detail-grid">

                            <div>

                              <span>
                                Cliente
                              </span>

                              <strong>
                                {
                                  servicioSeleccionado
                                    ?.citas
                                    ?.clientes
                                    ?.nombre ||
                                  '—'
                                }
                              </strong>

                            </div>


                            <div>

                              <span>
                                Teléfono
                              </span>

                              <strong>
                                {
                                  servicioSeleccionado
                                    ?.citas
                                    ?.clientes
                                    ?.telefono ||
                                  '—'
                                }
                              </strong>

                            </div>


                            <div>

                              <span>
                                Servicio
                              </span>

                              <strong>
                                {
                                  servicioSeleccionado
                                    ?.citas
                                    ?.tipos_servicio
                                    ?.nombre ||
                                  '—'
                                }
                              </strong>

                            </div>


                            <div>

                              <span>
                                Técnico
                              </span>

                              <strong>
                                {
                                  obtenerTecnicos(
                                    servicioSeleccionado
                                  )
                                }
                              </strong>

                            </div>


                            <div className="full">

                              <span>
                                Dirección
                              </span>

                              <strong>
                                {
                                  obtenerDireccion(
                                    servicioSeleccionado
                                  )
                                }
                              </strong>

                            </div>


                            <div>

                              <span>
                                Inicio
                              </span>

                              <strong>
                                {
                                  formatearFechaHora(
                                    servicioSeleccionado
                                      .fecha_inicio
                                  )
                                }
                              </strong>

                            </div>


                            <div>

                              <span>
                                Confirmación administrativa
                              </span>

                              <strong>
                                {
                                  formatearFechaHora(
                                    servicioSeleccionado
                                      .fecha_confirmacion_admin
                                  )
                                }
                              </strong>

                            </div>

                          </div>

                        </section>


                        {/* DIAGNOSTICO */}

                        <section className="srv-detail-card">

                          <h3>
                            Problema reportado
                          </h3>

                          <p>
                            {
                              servicioSeleccionado
                                .problema_reportado ||
                              servicioSeleccionado
                                ?.citas
                                ?.descripcion_problema ||
                              '—'
                            }
                          </p>


                          <h3>
                            Diagnóstico
                          </h3>

                          <p>
                            {
                              servicioSeleccionado
                                .diagnostico ||
                              '—'
                            }
                          </p>


                          <h3>
                            Trabajo realizado
                          </h3>

                          <p>
                            {
                              servicioSeleccionado
                                .trabajo_realizado ||
                              '—'
                            }
                          </p>


                          <h3>
                            Recomendaciones
                          </h3>

                          <p>
                            {
                              servicioSeleccionado
                                .recomendaciones ||
                              'Sin recomendaciones.'
                            }
                          </p>

                        </section>


                        {/* HERRAMIENTAS */}

                        <section className="srv-detail-card">

                          <h3>
                            Herramientas utilizadas
                          </h3>

                          {
                            detalleServicio
                              .herramientas
                              .length === 0
                              ? (

                                <p>
                                  Sin herramientas registradas.
                                </p>

                              )
                              : (

                                <div className="srv-tools">

                                  {
                                    detalleServicio
                                      .herramientas
                                      .map(
                                        (
                                          registro
                                        ) => (

                                          <span
                                            key={
                                              registro.id
                                            }
                                          >

                                            {
                                              registro
                                                ?.herramientas
                                                ?.nombre ||
                                              'Herramienta'
                                            }

                                          </span>

                                        )
                                      )
                                  }

                                </div>

                              )
                          }

                        </section>


                        {/* PAGO */}

                        <section className="srv-detail-card">

                          <h3>
                            Pago
                          </h3>

                          {
                            detalleServicio
                              .pagos
                              .length === 0
                              ? (

                                <p>
                                  Sin pago registrado.
                                </p>

                              )
                              : (

                                detalleServicio
                                  .pagos
                                  .map(
                                    (
                                      pago
                                    ) => (

                                      <div
                                        className="srv-payment"
                                        key={
                                          pago.id
                                        }
                                      >

                                        <div>

                                          <strong>

                                            {
                                              pago
                                                ?.metodos_pago
                                                ?.nombre ||
                                              'Método de pago'
                                            }

                                          </strong>

                                          <span>
                                            {
                                              pago.estatus
                                            }
                                          </span>

                                        </div>


                                        <strong>

                                          {
                                            formatearMoneda(
                                              pago.importe
                                            )
                                          }

                                        </strong>

                                      </div>

                                    )
                                  )

                              )
                          }

                        </section>


                        {/* EVIDENCIAS */}

                        <section className="srv-detail-card">

                          <h3>
                            Evidencias fotográficas
                          </h3>


                          {
                            [
                              [
                                'ANTES',
                                'Antes'
                              ],

                              [
                                'DURANTE',
                                'Durante'
                              ],

                              [
                                'DESPUES',
                                'Después'
                              ]
                            ].map(
                              (
                                [
                                  tipo,
                                  titulo
                                ]
                              ) => {

                                const fotos =
                                  obtenerEvidenciasTipo(
                                    tipo
                                  )

                                return (

                                  <div
                                    className="srv-evidence-group"
                                    key={
                                      tipo
                                    }
                                  >

                                    <strong>
                                      {titulo}
                                    </strong>


                                    {
                                      fotos.length ===
                                        0
                                        ? (

                                          <p>
                                            Sin fotografías.
                                          </p>

                                        )
                                        : (

                                          <div className="srv-photo-grid">

                                            {
                                              fotos.map(
                                                (
                                                  evidencia
                                                ) => (

                                                  <div
                                                    className="srv-photo"
                                                    key={
                                                      evidencia.id
                                                    }
                                                  >

                                                    {
                                                      evidencia
                                                        .preview_url
                                                        ? (

                                                          <img
                                                            src={
                                                              evidencia
                                                                .preview_url
                                                            }
                                                            alt={
                                                              titulo
                                                            }
                                                          />

                                                        )
                                                        : (

                                                          <div className="srv-photo-empty">
                                                            Imagen no disponible
                                                          </div>

                                                        )
                                                    }

                                                  </div>

                                                )
                                              )
                                            }

                                          </div>

                                        )
                                    }

                                  </div>

                                )
                              }
                            )
                          }

                        </section>


                        {/* ACCIONES PDF */}

                        <section className="srv-pdf-actions">

                          <button
                            type="button"
                            className="srv-pdf-view"
                            disabled={
                              generandoPdf
                            }
                            onClick={
                              verPdf
                            }
                          >
                            📄 Ver PDF
                          </button>


                          <button
                            type="button"
                            className="srv-pdf-download"
                            disabled={
                              generandoPdf
                            }
                            onClick={
                              descargarPdf
                            }
                          >

                            {
                              generandoPdf
                                ? 'Generando...'
                                : '⬇ Descargar PDF'
                            }

                          </button>

                        </section>

                      </>

                    )
                }

              </div>

            </div>

          </div>

        )
      }

    </div>
  )
}


export default Servicios