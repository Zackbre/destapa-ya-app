import {
  useEffect,
  useState
} from 'react'

import { supabase } from '../supabase'

import {
  descargarReporteServicio
} from '../utils/generarReporteServicio'

import './Dashboard.css'


function Dashboard({
  perfil,
  onLogout,
  onNuevaCita,
  onAgenda,
  onClientes,
  onServicios,
  onReportes,
  onGastos,
  onVehiculos,
  onInventario,
  onUsuarios
}) {

  // ==========================================
  // MENU
  // ==========================================

  const [
    menuAbierto,
    setMenuAbierto
  ] = useState(false)


  // ==========================================
  // DASHBOARD
  // ==========================================

  const [
    cargando,
    setCargando
  ] = useState(true)

  const [
    mensaje,
    setMensaje
  ] = useState('')


  const [
    kpis,
    setKpis
  ] = useState({
    serviciosHoy: 0,
    enProceso: 0,
    concluidos: 0,
    ingresosMes: 0
  })


  // ==========================================
  // PENDIENTES
  // ==========================================

  const [
    pendientes,
    setPendientes
  ] = useState([])


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
    procesandoConfirmacion,
    setProcesandoConfirmacion
  ] = useState(false)


  // ==========================================
  // CARGAR DASHBOARD
  // ==========================================

  useEffect(() => {

    cargarDashboard()

  }, [])


  // ==========================================
  // FECHA LOCAL
  // ==========================================

  function obtenerFechaLocal() {

    const fecha =
      new Date()


    const anio =
      fecha.getFullYear()


    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(
        2,
        '0'
      )


    const dia =
      String(
        fecha.getDate()
      ).padStart(
        2,
        '0'
      )


    return `${anio}-${mes}-${dia}`
  }


  // ==========================================
  // INICIO DEL MES
  // ==========================================

  function obtenerInicioMes() {

    const fecha =
      new Date()


    const inicio =
      new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        1,
        0,
        0,
        0
      )


    return inicio.toISOString()
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
  // FECHA Y HORA
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
  // CARGAR TODO
  // ==========================================

  async function cargarDashboard() {

    setCargando(true)
    setMensaje('')


    try {

      await Promise.all([
        cargarKpis(),
        cargarPendientes()
      ])


    } catch (error) {

      console.error(
        'Error cargando dashboard:',
        error
      )


      setMensaje(
        error?.message ||
        'No fue posible cargar el dashboard.'
      )


    } finally {

      setCargando(false)
    }
  }


  // ==========================================
  // KPIs
  // ==========================================

  async function cargarKpis() {

    const fechaHoy =
      obtenerFechaLocal()


    const inicioMes =
      obtenerInicioMes()


    const [
      resultadoHoy,
      resultadoProceso,
      resultadoConcluidos,
      resultadoPagos
    ] =
      await Promise.all([

        supabase
          .from('citas')
          .select(
            'id',
            {
              count:
                'exact',

              head:
                true
            }
          )
          .eq(
            'fecha',
            fechaHoy
          ),


        supabase
          .from('servicios')
          .select(
            'id',
            {
              count:
                'exact',

              head:
                true
            }
          )
          .eq(
            'estado',
            'EN_PROCESO'
          ),


        supabase
          .from('servicios')
          .select(
            'id',
            {
              count:
                'exact',

              head:
                true
            }
          )
          .eq(
            'estado',
            'CONCLUIDO'
          ),


        supabase
          .from('pagos')
          .select(`
            importe,
            created_at,
            estatus
          `)
          .eq(
            'estatus',
            'PAGADO'
          )
          .gte(
            'created_at',
            inicioMes
          )

      ])


    if (resultadoHoy.error) {
      throw resultadoHoy.error
    }


    if (resultadoProceso.error) {
      throw resultadoProceso.error
    }


    if (resultadoConcluidos.error) {
      throw resultadoConcluidos.error
    }


    if (resultadoPagos.error) {
      throw resultadoPagos.error
    }


    const ingresosMes =
      (
        resultadoPagos.data ||
        []
      ).reduce(
        (
          total,
          pago
        ) =>
          total +
          Number(
            pago.importe ||
            0
          ),
        0
      )


    setKpis({

      serviciosHoy:
        resultadoHoy.count ||
        0,

      enProceso:
        resultadoProceso.count ||
        0,

      concluidos:
        resultadoConcluidos.count ||
        0,

      ingresosMes

    })
  }


  // ==========================================
  // PENDIENTES DE CONFIRMACION
  // ==========================================

  async function cargarPendientes() {

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
          problema_reportado,
          diagnostico,
          trabajo_realizado,
          recomendaciones,
          estado,
          fecha_inicio,
          confirmado_admin,
          fecha_confirmacion_admin,
          confirmado_por,
          observacion_admin,

          citas (
            id,
            fecha,
            hora_estimada,
            descripcion_problema,

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
            ),

            citas_tecnicos (
              tecnico_id,

              perfiles (
                id,
                nombre
              )
            )
          )
        `)
        .eq(
          'estado',
          'CONCLUIDO'
        )
        .eq(
          'confirmado_admin',
          false
        )
        .order(
          'id',
          {
            ascending:
              false
          }
        )


    if (error) {

      console.error(
        'Error cargando pendientes:',
        error
      )


      throw new Error(
        'No fue posible cargar los servicios pendientes: ' +
        error.message
      )
    }


    setPendientes(
      data || []
    )
  }


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
  // CARGAR FOTOS PRIVADAS
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
      data?.session?.access_token


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
                  evidencia.archivo_url,
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
      detalleServicio?.evidencias ||
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
  // CONFIRMAR SERVICIO
  // ==========================================

  async function confirmarServicio() {

  if (!servicioSeleccionado) {
    return
  }


  if (!detalleServicio) {

    window.alert(
      'El expediente todavía no termina de cargar.'
    )

    return
  }


  const confirmar =
    window.confirm(
      `¿Confirmas el cierre administrativo del servicio ${servicioSeleccionado.folio}?\n\n` +
      'Al confirmar, el servicio quedará cerrado y se descargará automáticamente el reporte PDF final.'
    )


  if (!confirmar) {
    return
  }


  setProcesandoConfirmacion(
    true
  )


  try {

    const fechaConfirmacion =
      new Date()
        .toISOString()


    const {
      error
    } =
      await supabase
        .from('servicios')
        .update({

          confirmado_admin:
            true,

          fecha_confirmacion_admin:
            fechaConfirmacion,

          confirmado_por:
            perfil.id,

          observacion_admin:
            null

        })
        .eq(
          'id',
          servicioSeleccionado.id
        )


    if (error) {
      throw error
    }


    const tecnicosParaReporte =
      (
        servicioSeleccionado
          ?.citas
          ?.citas_tecnicos ||
        []
      )
        .map(
          asignacion => ({

            perfiles:
              asignacion
                ?.perfiles ||
              null

          })
        )


    const servicioParaReporte = {

      ...servicioSeleccionado,

      confirmado_admin:
        true,

      fecha_confirmacion_admin:
        fechaConfirmacion,

      confirmado_por:
        perfil.id,

      observacion_admin:
        null,

      servicios_tecnicos:
        tecnicosParaReporte
    }


    let pdfDescargado =
      true


    try {

      await descargarReporteServicio({

        servicio:
          servicioParaReporte,

        detalleServicio:
          detalleServicio

      })

    } catch (
      pdfError
    ) {

      pdfDescargado =
        false


      console.error(
        'El servicio fue confirmado, pero ocurrió un error generando el PDF:',
        pdfError
      )
    }


    if (
      pdfDescargado
    ) {

      window.alert(
        `✓ Servicio ${servicioSeleccionado.folio} confirmado correctamente.\n\n` +
        'El reporte PDF final se descargó automáticamente.'
      )

    } else {

      window.alert(
        `✓ Servicio ${servicioSeleccionado.folio} quedó confirmado correctamente.\n\n` +
        'No fue posible descargar el PDF automáticamente.'
      )
    }


    cerrarExpediente()


    await cargarDashboard()


  } catch (
    error
  ) {

    console.error(
      'Error confirmando servicio:',
      error
    )


    window.alert(
      'No fue posible confirmar el servicio:\n\n' +
      error.message
    )


  } finally {

    setProcesandoConfirmacion(
      false
    )
  }
}


  // ==========================================
  // REGRESAR AL TECNICO
  // ==========================================

  async function regresarAlTecnico() {

    if (
      !servicioSeleccionado
    ) {
      return
    }


    const motivo =
      'Prueba de devolución al técnico'


    const confirmar =
      window.confirm(
        `¿Deseas regresar el servicio ${servicioSeleccionado.folio} al técnico para corrección?`
      )


    if (
      !confirmar
    ) {
      return
    }


    setProcesandoConfirmacion(
      true
    )


    try {

      // ==========================================
      // SERVICIO
      // ==========================================

      const {
        error: servicioError
      } =
        await supabase
          .from('servicios')
          .update({

            estado:
              'EN_PROCESO',

            confirmado_admin:
              false,

            fecha_confirmacion_admin:
              null,

            confirmado_por:
              null,

            observacion_admin:
              motivo

          })
          .eq(
            'id',
            servicioSeleccionado.id
          )


      if (
        servicioError
      ) {

        throw new Error(
          'Error actualizando servicio: ' +
          servicioError.message
        )
      }


      // ==========================================
      // CITA
      // ==========================================

      const {
        error: citaError
      } =
        await supabase
          .from('citas')
          .update({

            estado:
              'EN_PROCESO'

          })
          .eq(
            'id',
            servicioSeleccionado.cita_id
          )


      if (
        citaError
      ) {

        throw new Error(
          'Error actualizando cita: ' +
          citaError.message
        )
      }


      window.alert(
        'Servicio regresado al técnico correctamente.'
      )


      cerrarExpediente()


      await cargarDashboard()


    } catch (
      error
    ) {

      console.error(
        'Error regresando servicio:',
        error
      )


      window.alert(
        'No fue posible regresar el servicio:\n\n' +
        error.message
      )


    } finally {

      setProcesandoConfirmacion(
        false
      )
    }
  }


  // ==========================================
  // CERRAR SESION
  // ==========================================

  async function cerrarSesion() {

    await supabase.auth.signOut()

    onLogout()
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


    const partes = [

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

    ].filter(Boolean)


    return partes.join(', ')
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
  // INTERFAZ
  // ==========================================

  return (

    <div className="app-shell">

      <aside
        className={
          `sidebar ${
            menuAbierto
              ? 'open'
              : ''
          }`
        }
      >

        <div className="brand">

          <div className="brand-mark">
            DY
          </div>


          <div>

            <div className="brand-title">
              DESTAPA YA
            </div>

            <div className="brand-subtitle">
              Rapidez · Limpieza · Confianza
            </div>

          </div>

        </div>


        <nav className="nav-menu">

          <div className="nav-section-title">
            OPERACIÓN
          </div>


          <button className="nav-item active">
            <span>⌂</span>
            Dashboard
          </button>


          <button
            className="nav-item"
            onClick={() => {

              setMenuAbierto(false)

              if (
                onNuevaCita
              ) {

                onNuevaCita()
              }

            }}
          >
            <span>＋</span>
            Nueva cita
          </button>


          <button
            className="nav-item"
            onClick={() => {

              setMenuAbierto(false)

              if (
                onAgenda
              ) {

                onAgenda()
              }

            }}
          >
            <span>◷</span>
            Agenda
          </button>


        <button
  className="nav-item"
  onClick={() => {

    setMenuAbierto(false)

    if (
      onClientes
    ) {

      onClientes()
    }

  }}
>
  <span>👥</span>
  Clientes
</button>


          <button
            className="nav-item"
            onClick={() => {

              setMenuAbierto(false)

              if (
                onServicios
              ) {

                onServicios()
              }

            }}
          >
            <span>🔧</span>
            Servicios
          </button>


          <div className="nav-section-title">
            ADMINISTRACIÓN
          </div>


          <button
  className="nav-item"
  onClick={() => {

    setMenuAbierto(false)

    if (onGastos) {
      onGastos()
    }

  }}
>
  <span>💳</span>
  Gastos
</button>


        <button
  className="nav-item"
  onClick={() => {

    setMenuAbierto(false)

    if (onInventario) {
      onInventario()
    }

  }}
>
  <span>▦</span>
  Inventario
</button>

        <button
  className="nav-item"
  onClick={() => {

    setMenuAbierto(false)

    if (onVehiculos) {
      onVehiculos()
    }

  }}
>
  <span>🚐</span>
  Vehículos
</button>

<button
  className="nav-item"
  onClick={() => {

    setMenuAbierto(false)

    if (onUsuarios) {
      onUsuarios()
    }

  }}
>
  <span>👤</span>
  Usuarios
</button>

        <button
  className="nav-item"
  onClick={() => {

    setMenuAbierto(false)

    if (onReportes) {
      onReportes()
    }

  }}

>
  <span>▤</span>
  Reportes
</button>

        </nav>


        <div className="sidebar-footer">

          <div className="user-mini">

            <div className="avatar">

              {
                perfil
                  ?.nombre
                  ?.charAt(0) ||
                'A'
              }

            </div>


            <div>

              <div className="user-name">
                {perfil?.nombre}
              </div>

              <div className="user-role">
                {perfil?.roles?.nombre}
              </div>

            </div>

          </div>


          <button
            className="logout-btn"
            onClick={
              cerrarSesion
            }
          >
            Cerrar sesión
          </button>

        </div>

      </aside>


      {
        menuAbierto && (

          <div
            className="mobile-overlay"
            onClick={() => {
              setMenuAbierto(false)
            }}
          />

        )
      }


      <main className="main-content">

        <header className="topbar">

          <div className="topbar-left">

            <button
              className="menu-button"
              onClick={() => {
                setMenuAbierto(true)
              }}
            >
              ☰
            </button>


            <div>

              <h1>
                Dashboard
              </h1>

              <p>
                Resumen general de la operación
              </p>

            </div>

          </div>


          <div className="topbar-right">

            <button
              className="quick-button"
              onClick={() => {

                if (
                  onNuevaCita
                ) {

                  onNuevaCita()
                }

              }}
            >
              + Nueva cita
            </button>


            <div className="top-avatar">

              {
                perfil
                  ?.nombre
                  ?.charAt(0) ||
                'A'
              }

            </div>

          </div>

        </header>


        <section className="dashboard-content">

          <div className="welcome-card">

            <div>

              <span className="welcome-label">
                PANEL ADMINISTRATIVO
              </span>

              <h2>
                Hola, {perfil?.nombre}
              </h2>

              <p>
                Aquí tienes el resumen de DESTAPA YA.
              </p>

            </div>


            <div className="welcome-badge">
              24/7
            </div>

          </div>


          {
            mensaje && (

              <div
                style={{
                  marginBottom:
                    '18px',

                  padding:
                    '14px',

                  borderRadius:
                    '12px',

                  background:
                    '#FFF4F2',

                  color:
                    '#B42318',

                  fontSize:
                    '13px'
                }}
              >
                {mensaje}
              </div>

            )
          }


          {/* ===================================
              KPIs
          =================================== */}

          <div className="kpi-grid">

            <div className="kpi-card">

              <div className="kpi-icon">
                📅
              </div>

              <div>

                <span>
                  Servicios hoy
                </span>

                <strong>
                  {
                    cargando
                      ? '...'
                      : kpis.serviciosHoy
                  }
                </strong>

                <small>
                  Programados para hoy
                </small>

              </div>

            </div>


            <div className="kpi-card">

              <div className="kpi-icon">
                🔧
              </div>

              <div>

                <span>
                  En proceso
                </span>

                <strong>
                  {
                    cargando
                      ? '...'
                      : kpis.enProceso
                  }
                </strong>

                <small>
                  Servicios activos
                </small>

              </div>

            </div>


            <div className="kpi-card">

              <div className="kpi-icon">
                ✓
              </div>

              <div>

                <span>
                  Concluidos
                </span>

                <strong>
                  {
                    cargando
                      ? '...'
                      : kpis.concluidos
                  }
                </strong>

                <small>
                  Servicios terminados
                </small>

              </div>

            </div>


            <div className="kpi-card highlight">

              <div className="kpi-icon">
                $
              </div>

              <div>

                <span>
                  Ingresos del mes
                </span>

                <strong>
                  {
                    cargando
                      ? '...'
                      : formatearMoneda(
                          kpis.ingresosMes
                        )
                  }
                </strong>

                <small>
                  Pagos registrados
                </small>

              </div>

            </div>

          </div>


          {/* ===================================
              PENDIENTES
          =================================== */}

          <div
            className="panel-card"
            style={{
              marginBottom:
                '20px'
            }}
          >

            <div className="panel-header">

              <div>

                <h3>
                  Pendientes de confirmación
                </h3>

                <p>
                  Servicios concluidos que requieren revisión administrativa
                </p>

              </div>


              <div
                style={{
                  minWidth:
                    '36px',

                  height:
                    '36px',

                  borderRadius:
                    '999px',

                  display:
                    'grid',

                  placeItems:
                    'center',

                  background:
                    pendientes.length > 0
                      ? '#FFF4E5'
                      : '#ECFDF3',

                  color:
                    pendientes.length > 0
                      ? '#B54708'
                      : '#027A48',

                  fontWeight:
                    '800'
                }}
              >
                {pendientes.length}
              </div>

            </div>


            {
              cargando
                ? (

                  <div className="empty-state">

                    <p>
                      Cargando servicios...
                    </p>

                  </div>

                )
                : pendientes.length === 0
                  ? (

                    <div className="empty-state">

                      <div className="empty-icon">
                        ✓
                      </div>

                      <h4>
                        Todo está al día
                      </h4>

                      <p>
                        No hay servicios pendientes de confirmación.
                      </p>

                    </div>

                  )
                  : (

                    <div
                      style={{
                        display:
                          'grid',

                        gap:
                          '12px'
                      }}
                    >

                      {
                        pendientes.map(
                          (
                            servicio
                          ) => (

                            <div
                              key={
                                servicio.id
                              }
                              style={{
                                padding:
                                  '16px',

                                border:
                                  '1px solid #E5EAF0',

                                borderRadius:
                                  '14px',

                                background:
                                  '#FBFCFE',

                                display:
                                  'flex',

                                justifyContent:
                                  'space-between',

                                gap:
                                  '16px',

                                alignItems:
                                  'center',

                                flexWrap:
                                  'wrap'
                              }}
                            >

                              <div>

                                <div
                                  style={{
                                    fontSize:
                                      '11px',

                                    fontWeight:
                                      '800',

                                    color:
                                      '#0077CC',

                                    marginBottom:
                                      '4px'
                                  }}
                                >
                                  {servicio.folio}
                                </div>


                                <div
                                  style={{
                                    fontWeight:
                                      '800',

                                    color:
                                      '#0D1B3D',

                                    marginBottom:
                                      '4px'
                                  }}
                                >
                                  {
                                    servicio
                                      ?.citas
                                      ?.clientes
                                      ?.nombre ||
                                    'Cliente'
                                  }
                                </div>


                                <div
                                  style={{
                                    fontSize:
                                      '12px',

                                    color:
                                      '#667085'
                                  }}
                                >
                                  {
                                    servicio
                                      ?.citas
                                      ?.tipos_servicio
                                      ?.nombre ||
                                    'Servicio'
                                  }
                                </div>


                                <div
                                  style={{
                                    marginTop:
                                      '7px',

                                    fontSize:
                                      '11px',

                                    color:
                                      '#98A1AE'
                                  }}
                                >
                                  Inicio:{' '}

                                  {
                                    formatearFechaHora(
                                      servicio.fecha_inicio
                                    )
                                  }
                                </div>

                              </div>


                              <button
                                type="button"
                                className="quick-button"
                                onClick={() =>
                                  abrirExpediente(
                                    servicio
                                  )
                                }
                              >
                                Revisar expediente
                              </button>

                            </div>

                          )
                        )
                      }

                    </div>

                  )
            }

          </div>


          {/* ===================================
              RESTO DASHBOARD
          =================================== */}

          <div className="dashboard-grid">

            <div className="panel-card large">

              <div className="panel-header">

                <div>

                  <h3>
                    Actividad reciente
                  </h3>

                  <p>
                    Resumen de la operación
                  </p>

                </div>


                <button
                  className="text-button"
                  onClick={
                    cargarDashboard
                  }
                >
                  Actualizar
                </button>

              </div>


              <div className="empty-state">

                <div className="empty-icon">
                  🔧
                </div>

                <h4>
                  Operación DESTAPA YA
                </h4>

                <p>
                  Aquí mostraremos posteriormente el historial reciente.
                </p>

              </div>

            </div>


            <div className="panel-card">

              <div className="panel-header">

                <div>

                  <h3>
                    Accesos rápidos
                  </h3>

                  <p>
                    Operaciones frecuentes
                  </p>

                </div>

              </div>


              <div className="quick-grid">

                <button
                  className="quick-card"
                  onClick={() => {

                    if (
                      onNuevaCita
                    ) {

                      onNuevaCita()
                    }

                  }}
                >
                  <span>＋</span>
                  Nueva cita
                </button>


              <button
  className="quick-card"
  onClick={() => {

    if (onReportes) {
      onReportes()
    }

  }}
>
  <span>▤</span>
  Reportes
</button>

                <button
                  className="quick-card"
                  onClick={() => {

                    if (
                      onServicios
                    ) {

                      onServicios()
                    }

                  }}
                >
                  <span>🔧</span>
                  Servicios
                </button>


                <button className="quick-card">
                  <span>▤</span>
                  Reportes
                </button>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* ======================================
          MODAL EXPEDIENTE
      ====================================== */}

      {
        servicioSeleccionado && (

          <div
            style={{
              position:
                'fixed',

              inset:
                0,

              background:
                'rgba(13,27,61,.65)',

              zIndex:
                9999,

              display:
                'flex',

              justifyContent:
                'center',

              alignItems:
                'flex-start',

              overflowY:
                'auto',

              padding:
                '30px 15px'
            }}
          >

            <div
              style={{
                width:
                  'min(900px, 100%)',

                background:
                  '#F5F7FA',

                borderRadius:
                  '22px',

                overflow:
                  'hidden',

                boxShadow:
                  '0 25px 70px rgba(0,0,0,.25)'
              }}
            >

              <div
                style={{
                  padding:
                    '22px',

                  background:
                    'linear-gradient(120deg,#0D1B3D,#12356B 65%,#0077CC)',

                  color:
                    'white',

                  display:
                    'flex',

                  justifyContent:
                    'space-between',

                  gap:
                    '20px',

                  alignItems:
                    'flex-start'
                }}
              >

                <div>

                  <div
                    style={{
                      fontSize:
                        '10px',

                      color:
                        '#8ED1FF',

                      fontWeight:
                        '800'
                    }}
                  >
                    REVISIÓN ADMINISTRATIVA
                  </div>


                  <h2
                    style={{
                      margin:
                        '6px 0'
                    }}
                  >
                    {servicioSeleccionado.folio}
                  </h2>


                  <div
                    style={{
                      fontSize:
                        '12px',

                      color:
                        'rgba(255,255,255,.7)'
                    }}
                  >
                    Servicio concluido · Pendiente de confirmación
                  </div>

                </div>


                <button
                  type="button"
                  onClick={
                    cerrarExpediente
                  }
                  style={{
                    border:
                      '1px solid rgba(255,255,255,.25)',

                    background:
                      'rgba(255,255,255,.1)',

                    color:
                      'white',

                    width:
                      '38px',

                    height:
                      '38px',

                    borderRadius:
                      '10px',

                    cursor:
                      'pointer'
                  }}
                >
                  ✕
                </button>

              </div>


              <div
                style={{
                  padding:
                    '20px',

                  display:
                    'grid',

                  gap:
                    '15px'
                }}
              >

                {
                  cargandoDetalle
                    ? (

                      <div className="panel-card">
                        Cargando expediente...
                      </div>

                    )
                    : detalleServicio && (

                      <>

                        {/* CLIENTE */}

                        <div className="panel-card">

                          <h3>
                            Cliente y servicio
                          </h3>


                          <div
                            style={{
                              display:
                                'grid',

                              gridTemplateColumns:
                                'repeat(auto-fit,minmax(180px,1fr))',

                              gap:
                                '15px',

                              fontSize:
                                '13px'
                            }}
                          >

                            <div>

                              <strong>
                                Cliente
                              </strong>

                              <div>
                                {
                                  servicioSeleccionado
                                    ?.citas
                                    ?.clientes
                                    ?.nombre ||
                                  '—'
                                }
                              </div>

                            </div>


                            <div>

                              <strong>
                                Teléfono
                              </strong>

                              <div>
                                {
                                  servicioSeleccionado
                                    ?.citas
                                    ?.clientes
                                    ?.telefono ||
                                  '—'
                                }
                              </div>

                            </div>


                            <div>

                              <strong>
                                Servicio
                              </strong>

                              <div>
                                {
                                  servicioSeleccionado
                                    ?.citas
                                    ?.tipos_servicio
                                    ?.nombre ||
                                  '—'
                                }
                              </div>

                            </div>


                            <div>

                              <strong>
                                Dirección
                              </strong>

                              <div>
                                {
                                  obtenerDireccion(
                                    servicioSeleccionado
                                  )
                                }
                              </div>

                            </div>

                          </div>

                        </div>


                        {/* DIAGNOSTICO */}

                        <div className="panel-card">

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
                            Recomendaciones / observaciones
                          </h3>

                          <p>
                            {
                              servicioSeleccionado
                                .recomendaciones ||
                              'Sin observaciones.'
                            }
                          </p>

                        </div>


                        {/* HERRAMIENTAS */}

                        <div className="panel-card">

                          <h3>
                            Herramientas utilizadas
                          </h3>


                          {
                            detalleServicio
                              .herramientas
                              .length === 0
                              ? (

                                <p>
                                  No se registraron herramientas.
                                </p>

                              )
                              : (

                                <div
                                  style={{
                                    display:
                                      'flex',

                                    gap:
                                      '8px',

                                    flexWrap:
                                      'wrap'
                                  }}
                                >

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
                                            style={{
                                              padding:
                                                '8px 11px',

                                              borderRadius:
                                                '999px',

                                              background:
                                                '#EDF8FF',

                                              color:
                                                '#0077CC',

                                              fontSize:
                                                '11px',

                                              fontWeight:
                                                '700'
                                            }}
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

                        </div>


                        {/* PAGO */}

                        <div className="panel-card">

                          <h3>
                            Pago
                          </h3>


                          {
                            detalleServicio
                              .pagos
                              .length === 0
                              ? (

                                <p>
                                  No se encontró pago registrado.
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
                                        key={
                                          pago.id
                                        }
                                        style={{
                                          display:
                                            'flex',

                                          justifyContent:
                                            'space-between',

                                          gap:
                                            '15px',

                                          alignItems:
                                            'center',

                                          padding:
                                            '12px 0',

                                          borderBottom:
                                            '1px solid #E5EAF0'
                                        }}
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

                                          <div
                                            style={{
                                              fontSize:
                                                '11px',

                                              color:
                                                '#667085'
                                            }}
                                          >
                                            {pago.estatus}
                                          </div>

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

                        </div>


                        {/* EVIDENCIAS */}

                        <div className="panel-card">

                          <h3>
                            Evidencias
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
                                    key={
                                      tipo
                                    }
                                    style={{
                                      marginTop:
                                        '18px'
                                    }}
                                  >

                                    <strong>
                                      {titulo}
                                    </strong>


                                    {
                                      fotos.length === 0
                                        ? (

                                          <p
                                            style={{
                                              color:
                                                '#98A1AE'
                                            }}
                                          >
                                            Sin fotografías.
                                          </p>

                                        )
                                        : (

                                          <div
                                            style={{
                                              display:
                                                'grid',

                                              gridTemplateColumns:
                                                'repeat(auto-fit,minmax(160px,1fr))',

                                              gap:
                                                '10px',

                                              marginTop:
                                                '8px'
                                            }}
                                          >

                                            {
                                              fotos.map(
                                                (
                                                  evidencia
                                                ) => (

                                                  <div
                                                    key={
                                                      evidencia.id
                                                    }
                                                    style={{
                                                      border:
                                                        '1px solid #E5EAF0',

                                                      borderRadius:
                                                        '12px',

                                                      overflow:
                                                        'hidden',

                                                      background:
                                                        '#F8FAFC'
                                                    }}
                                                  >

                                                    {
                                                      evidencia.preview_url
                                                        ? (

                                                          <img
                                                            src={
                                                              evidencia.preview_url
                                                            }
                                                            alt={
                                                              titulo
                                                            }
                                                            style={{
                                                              width:
                                                                '100%',

                                                              height:
                                                                '150px',

                                                              objectFit:
                                                                'cover',

                                                              display:
                                                                'block'
                                                            }}
                                                          />

                                                        )
                                                        : (

                                                          <div
                                                            style={{
                                                              height:
                                                                '150px',

                                                              display:
                                                                'grid',

                                                              placeItems:
                                                                'center',

                                                              color:
                                                                '#98A1AE'
                                                            }}
                                                          >
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

                        </div>


                        {/* ACCIONES ADMIN */}

                        <div
                          style={{
                            display:
                              'flex',

                            gap:
                              '10px',

                            justifyContent:
                              'flex-end',

                            flexWrap:
                              'wrap'
                          }}
                        >

                          <button
                            type="button"
                            disabled={
                              procesandoConfirmacion
                            }
                            onClick={
                              regresarAlTecnico
                            }
                            style={{
                              border:
                                '1px solid #D92D20',

                              background:
                                'white',

                              color:
                                '#D92D20',

                              padding:
                                '12px 18px',

                              borderRadius:
                                '11px',

                              cursor:
                                'pointer',

                              fontWeight:
                                '700'
                            }}
                          >
                            ↩ Regresar al técnico
                          </button>


                          <button
                            type="button"
                            disabled={
                              procesandoConfirmacion
                            }
                            onClick={
                              confirmarServicio
                            }
                            className="quick-button"
                          >

                            {
                              procesandoConfirmacion
                                ? 'PROCESANDO...'
                                : '✓ Confirmar servicio'
                            }

                          </button>

                        </div>

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


export default Dashboard