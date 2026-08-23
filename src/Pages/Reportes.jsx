import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { supabase } from '../supabase'
import './Reportes.css'


function Reportes({ onVolver }) {

  const hoy = obtenerFechaLocal(new Date())
  const inicioMesActual = obtenerInicioMesLocal(new Date())

  const [fechaDesde, setFechaDesde] =
    useState(inicioMesActual)

  const [fechaHasta, setFechaHasta] =
    useState(hoy)

  const [servicios, setServicios] =
    useState([])

  const [gastos, setGastos] =
    useState([])

  const [cargando, setCargando] =
    useState(true)

  const [mensaje, setMensaje] =
    useState('')

  const [resumenComercial, setResumenComercial] =
    useState({
      serviciosMes: 0,
      ingresosMes: 0,
      gastosMes: 0,
      utilidadMes: 0,
      margenMes: 0,
      serviciosAnio: 0,
      ingresosAnio: 0,
      gastosAnio: 0,
      utilidadAnio: 0,
      margenAnio: 0
    })

  const [cuotaMensual, setCuotaMensual] =
    useState(() =>
      Number(
        window.localStorage.getItem(
          'destapa_ya_cuota_mensual'
        ) || 0
      )
    )

  const [cuotaAnual, setCuotaAnual] =
    useState(() =>
      Number(
        window.localStorage.getItem(
          'destapa_ya_cuota_anual'
        ) || 0
      )
    )


  useEffect(() => {
    cargarReportes()
  }, [])


  // ==========================================
  // FECHAS
  // ==========================================

  function obtenerFechaLocal(fecha) {
    const anio = fecha.getFullYear()
    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0')
    const dia = String(
      fecha.getDate()
    ).padStart(2, '0')

    return `${anio}-${mes}-${dia}`
  }


  function obtenerInicioMesLocal(fecha) {
    const inicio = new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      1
    )

    return obtenerFechaLocal(inicio)
  }


  function formatearFecha(valor) {
    if (!valor) {
      return '—'
    }

    const fecha = new Date(
      `${valor}T12:00:00`
    )

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    ).format(fecha)
  }


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


  // ==========================================
  // CARGAR DATOS
  // ==========================================

  async function cargarReportes(
    desde = fechaDesde,
    hasta = fechaHasta
  ) {
    if (
      desde &&
      hasta &&
      desde > hasta
    ) {
      setMensaje(
        'La fecha inicial no puede ser mayor que la fecha final.'
      )
      return
    }

    setCargando(true)
    setMensaje('')

    try {
      let consulta =
        supabase
          .from('servicios')
          .select(`
            id,
            folio,
            estado,
            confirmado_admin,
            fecha_inicio,
            fecha_conclusion,

            citas!inner (
              id,
              fecha,
              hora_estimada,

              clientes (
                id,
                nombre,
                tipo_cliente
              ),

              tipos_servicio (
                id,
                nombre
              ),

              direcciones_cliente (
                id,
                municipio
              )
            ),

            servicios_tecnicos (
              tecnico_id,

              perfiles (
                id,
                nombre
              )
            ),

            servicios_herramientas (
              herramienta_id,

              herramientas (
                id,
                nombre
              )
            ),

            pagos (
              id,
              importe,
              estatus,
              created_at,

              metodos_pago (
                id,
                nombre
              )
            )
          `)
          .order(
            'id',
            { ascending: false }
          )

      if (desde) {
        consulta = consulta.gte(
          'citas.fecha',
          desde
        )
      }

      if (hasta) {
        consulta = consulta.lte(
          'citas.fecha',
          hasta
        )
      }

      const ahora = new Date()
      const anioActual = ahora.getFullYear()
      const inicioAnioActual =
        `${anioActual}-01-01`
      const inicioMesComercial =
        obtenerInicioMesLocal(ahora)
      const hoyComercial =
        obtenerFechaLocal(ahora)

      const consultaComercial =
        supabase
          .from('servicios')
          .select(`
            id,
            estado,
            confirmado_admin,

            citas!inner (
              fecha
            ),

            pagos (
              id,
              importe,
              estatus
            )
          `)
          .gte(
            'citas.fecha',
            inicioAnioActual
          )
          .lte(
            'citas.fecha',
            hoyComercial
          )

      let consultaGastosPeriodo =
        supabase
          .from('gastos')
          .select(`
            id,
            fecha,
            importe,
            alcance,
            categoria,
            activo
          `)
          .eq(
            'activo',
            true
          )
          .order(
            'fecha',
            { ascending: false }
          )

      if (desde) {
        consultaGastosPeriodo =
          consultaGastosPeriodo.gte(
            'fecha',
            desde
          )
      }

      if (hasta) {
        consultaGastosPeriodo =
          consultaGastosPeriodo.lte(
            'fecha',
            hasta
          )
      }

      const consultaGastosComercial =
        supabase
          .from('gastos')
          .select(`
            id,
            fecha,
            importe,
            alcance,
            categoria,
            activo
          `)
          .eq(
            'activo',
            true
          )
          .gte(
            'fecha',
            inicioAnioActual
          )
          .lte(
            'fecha',
            hoyComercial
          )

      const [
        resultadoPeriodo,
        resultadoComercial,
        resultadoGastosPeriodo,
        resultadoGastosComercial
      ] =
        await Promise.all([
          consulta,
          consultaComercial,
          consultaGastosPeriodo,
          consultaGastosComercial
        ])

      if (resultadoPeriodo.error) {
        throw resultadoPeriodo.error
      }

      if (resultadoComercial.error) {
        throw resultadoComercial.error
      }

      if (resultadoGastosPeriodo.error) {
        throw resultadoGastosPeriodo.error
      }

      if (resultadoGastosComercial.error) {
        throw resultadoGastosComercial.error
      }

      const datosPeriodo =
        resultadoPeriodo.data || []

      const datosComerciales =
        resultadoComercial.data || []

      const gastosPeriodo =
        resultadoGastosPeriodo.data || []

      const gastosComerciales =
        resultadoGastosComercial.data || []

      setServicios(
        datosPeriodo
      )

      setGastos(
        gastosPeriodo
      )

      const serviciosRealizadosAnio =
        datosComerciales.filter(
          servicio =>
            servicio.confirmado_admin ===
              true ||
            servicio.estado ===
              'CONCLUIDO'
        )

      const serviciosRealizadosMes =
        serviciosRealizadosAnio.filter(
          servicio =>
            servicio
              ?.citas
              ?.fecha >=
            inicioMesComercial
        )

      const calcularIngresos =
        lista =>
          lista.reduce(
            (total, servicio) =>
              total +
              (
                servicio?.pagos || []
              )
                .filter(
                  pago =>
                    String(
                      pago.estatus || ''
                    ).toUpperCase() ===
                    'PAGADO'
                )
                .reduce(
                  (subtotal, pago) =>
                    subtotal +
                    Number(
                      pago.importe || 0
                    ),
                  0
                ),
            0
          )

      const calcularGastos =
        lista =>
          lista.reduce(
            (total, gasto) =>
              total +
              Number(
                gasto.importe || 0
              ),
            0
          )

      const gastosAnio =
        calcularGastos(
          gastosComerciales
        )

      const gastosMes =
        calcularGastos(
          gastosComerciales.filter(
            gasto =>
              gasto.fecha >=
              inicioMesComercial
          )
        )

      const ingresosMes =
        calcularIngresos(
          serviciosRealizadosMes
        )

      const ingresosAnio =
        calcularIngresos(
          serviciosRealizadosAnio
        )

      const utilidadMes =
        ingresosMes -
        gastosMes

      const utilidadAnio =
        ingresosAnio -
        gastosAnio

      const margenMes =
        ingresosMes > 0
          ? (
              utilidadMes /
              ingresosMes
            ) * 100
          : 0

      const margenAnio =
        ingresosAnio > 0
          ? (
              utilidadAnio /
              ingresosAnio
            ) * 100
          : 0

      setResumenComercial({
        serviciosMes:
          serviciosRealizadosMes.length,
        ingresosMes,
        gastosMes,
        utilidadMes,
        margenMes,
        serviciosAnio:
          serviciosRealizadosAnio.length,
        ingresosAnio,
        gastosAnio,
        utilidadAnio,
        margenAnio
      })

    } catch (error) {
      console.error(
        'Error cargando reportes:',
        error
      )

      setMensaje(
        'No fue posible cargar los reportes: ' +
        error.message
      )

      setServicios([])
      setGastos([])

    } finally {
      setCargando(false)
    }
  }


  // ==========================================
  // METAS COMERCIALES
  // ==========================================

  function guardarCuotas() {
    const mensual =
      Math.max(
        Number(cuotaMensual || 0),
        0
      )

    const anual =
      Math.max(
        Number(cuotaAnual || 0),
        0
      )

    setCuotaMensual(mensual)
    setCuotaAnual(anual)

    window.localStorage.setItem(
      'destapa_ya_cuota_mensual',
      String(mensual)
    )

    window.localStorage.setItem(
      'destapa_ya_cuota_anual',
      String(anual)
    )

    window.alert(
      'Metas comerciales guardadas correctamente.'
    )
  }


  function calcularAvance(
    actual,
    meta
  ) {
    const objetivo =
      Number(meta || 0)

    if (objetivo <= 0) {
      return 0
    }

    return (
      Number(actual || 0) /
      objetivo
    ) * 100
  }


  function formatearPorcentaje(valor) {
    return new Intl.NumberFormat(
      'es-MX',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }
    ).format(
      Number(valor || 0)
    ) + '%'
  }


  // ==========================================
  // ATAJOS DE PERIODO
  // ==========================================

  function aplicarPeriodo(tipo) {
    const ahora = new Date()
    let desde = ''
    let hasta = obtenerFechaLocal(ahora)

    if (tipo === 'MES') {
      desde = obtenerInicioMesLocal(ahora)
    }

    if (tipo === '30') {
      const fecha = new Date()
      fecha.setDate(
        fecha.getDate() - 29
      )
      desde = obtenerFechaLocal(fecha)
    }

    if (tipo === 'ANIO') {
      desde = `${ahora.getFullYear()}-01-01`
    }

    if (tipo === 'TODO') {
      desde = ''
      hasta = ''
    }

    setFechaDesde(desde)
    setFechaHasta(hasta)

    cargarReportes(
      desde,
      hasta
    )
  }


  // ==========================================
  // UTILIDADES DE SERVICIO
  // ==========================================

  function pagosPagados(servicio) {
    return (
      servicio?.pagos || []
    ).filter(
      pago =>
        String(
          pago.estatus || ''
        ).toUpperCase() ===
        'PAGADO'
    )
  }


  function ingresoServicio(servicio) {
    return pagosPagados(servicio)
      .reduce(
        (total, pago) =>
          total +
          Number(
            pago.importe || 0
          ),
        0
      )
  }


  function nombreCliente(servicio) {
    return servicio
      ?.citas
      ?.clientes
      ?.nombre || 'Sin cliente'
  }


  function nombreTipoServicio(servicio) {
    return servicio
      ?.citas
      ?.tipos_servicio
      ?.nombre || 'Sin tipo'
  }


  function nombresTecnicos(servicio) {
    const nombres = (
      servicio
        ?.servicios_tecnicos || []
    )
      .map(
        asignacion =>
          asignacion
            ?.perfiles
            ?.nombre
      )
      .filter(Boolean)

    return nombres.length
      ? nombres.join(', ')
      : 'Sin técnico'
  }


  function nombreMunicipio(servicio) {
    return servicio
      ?.citas
      ?.direcciones_cliente
      ?.municipio || 'Sin municipio'
  }


  function nombresMaquinaria(servicio) {
    const nombres = (
      servicio
        ?.servicios_herramientas || []
    )
      .map(
        registro =>
          registro
            ?.herramientas
            ?.nombre
      )
      .filter(Boolean)

    return nombres.length
      ? nombres.join(', ')
      : 'Sin maquinaria registrada'
  }


  // ==========================================
  // KPIs
  // ==========================================

  const resumen =
    useMemo(
      () => {
        const ingresos =
          servicios.reduce(
            (total, servicio) =>
              total +
              ingresoServicio(servicio),
            0
          )

        const concluidos =
          servicios.filter(
            servicio =>
              servicio.estado ===
              'CONCLUIDO'
          ).length

        const confirmados =
          servicios.filter(
            servicio =>
              servicio.confirmado_admin ===
              true
          ).length

        const serviciosPagados =
          servicios.filter(
            servicio =>
              ingresoServicio(servicio) > 0
          ).length

        const ticketPromedio =
          serviciosPagados > 0
            ? ingresos /
              serviciosPagados
            : 0

        const clientesUnicos =
          new Set(
            servicios
              .map(
                servicio =>
                  servicio
                    ?.citas
                    ?.clientes
                    ?.id
              )
              .filter(Boolean)
          ).size

        const municipiosUnicos =
          new Set(
            servicios
              .map(
                servicio =>
                  servicio
                    ?.citas
                    ?.direcciones_cliente
                    ?.municipio
              )
              .filter(Boolean)
          ).size

        const maquinariasUnicas =
          new Set(
            servicios
              .flatMap(
                servicio =>
                  (
                    servicio
                      ?.servicios_herramientas || []
                  ).map(
                    registro =>
                      registro
                        ?.herramientas
                        ?.id
                  )
              )
              .filter(Boolean)
          ).size

        const gastosPeriodo =
          gastos.reduce(
            (total, gasto) =>
              total +
              Number(
                gasto.importe || 0
              ),
            0
          )

        const utilidad =
          ingresos -
          gastosPeriodo

        const margen =
          ingresos > 0
            ? (
                utilidad /
                ingresos
              ) * 100
            : 0

        return {
          total: servicios.length,
          concluidos,
          confirmados,
          ingresos,
          gastos: gastosPeriodo,
          utilidad,
          margen,
          ticketPromedio,
          clientesUnicos,
          municipiosUnicos,
          maquinariasUnicas
        }
      },
      [
        servicios,
        gastos
      ]
    )


  // ==========================================
  // TIPOS DE SERVICIO
  // ==========================================

  const porTipoServicio =
    useMemo(
      () => {
        const mapa = new Map()

        servicios.forEach(
          servicio => {
            const nombre =
              nombreTipoServicio(
                servicio
              )

            const actual =
              mapa.get(nombre) || {
                nombre,
                servicios: 0,
                ingresos: 0
              }

            actual.servicios += 1
            actual.ingresos +=
              ingresoServicio(
                servicio
              )

            mapa.set(
              nombre,
              actual
            )
          }
        )

        return Array.from(
          mapa.values()
        ).sort(
          (a, b) =>
            b.servicios -
            a.servicios
        )
      },
      [servicios]
    )


  // ==========================================
  // MUNICIPIOS
  // ==========================================

  const porMunicipio =
    useMemo(
      () => {
        const mapa = new Map()

        servicios.forEach(
          servicio => {
            const nombre =
              nombreMunicipio(
                servicio
              )

            const actual =
              mapa.get(nombre) || {
                nombre,
                servicios: 0,
                ingresos: 0
              }

            actual.servicios += 1
            actual.ingresos +=
              ingresoServicio(
                servicio
              )

            mapa.set(
              nombre,
              actual
            )
          }
        )

        return Array.from(
          mapa.values()
        ).sort(
          (a, b) =>
            b.servicios -
            a.servicios
        )
      },
      [servicios]
    )


  // ==========================================
  // MAQUINARIA / EQUIPO UTILIZADO
  // ==========================================

  const porMaquinaria =
    useMemo(
      () => {
        const mapa = new Map()

        servicios.forEach(
          servicio => {
            const registros =
              servicio
                ?.servicios_herramientas || []

            registros.forEach(
              registro => {
                const herramienta =
                  registro?.herramientas

                if (!herramienta?.id) {
                  return
                }

                const actual =
                  mapa.get(
                    herramienta.id
                  ) || {
                    id: herramienta.id,
                    nombre:
                      herramienta.nombre ||
                      'Equipo',
                    servicios: 0
                  }

                actual.servicios += 1

                mapa.set(
                  herramienta.id,
                  actual
                )
              }
            )
          }
        )

        return Array.from(
          mapa.values()
        ).sort(
          (a, b) =>
            b.servicios -
            a.servicios
        )
      },
      [servicios]
    )


  // ==========================================
  // CLIENTES
  // ==========================================

  const topClientes =
    useMemo(
      () => {
        const mapa = new Map()

        servicios.forEach(
          servicio => {
            const cliente =
              servicio
                ?.citas
                ?.clientes

            const id =
              cliente?.id ||
              `sin-${nombreCliente(servicio)}`

            const actual =
              mapa.get(id) || {
                id,
                nombre:
                  cliente?.nombre ||
                  'Sin cliente',
                servicios: 0,
                ingresos: 0
              }

            actual.servicios += 1
            actual.ingresos +=
              ingresoServicio(
                servicio
              )

            mapa.set(id, actual)
          }
        )

        return Array.from(
          mapa.values()
        )
          .sort(
            (a, b) =>
              b.ingresos -
              a.ingresos ||
              b.servicios -
              a.servicios
          )
          .slice(0, 10)
      },
      [servicios]
    )


  // ==========================================
  // TECNICOS
  // ==========================================

  const productividadTecnicos =
    useMemo(
      () => {
        const mapa = new Map()

        servicios.forEach(
          servicio => {
            const asignaciones =
              servicio
                ?.servicios_tecnicos || []

            asignaciones.forEach(
              asignacion => {
                const tecnico =
                  asignacion?.perfiles

                if (!tecnico?.id) {
                  return
                }

                const actual =
                  mapa.get(
                    tecnico.id
                  ) || {
                    id: tecnico.id,
                    nombre:
                      tecnico.nombre ||
                      'Técnico',
                    servicios: 0,
                    concluidos: 0,
                    confirmados: 0
                  }

                actual.servicios += 1

                if (
                  servicio.estado ===
                  'CONCLUIDO'
                ) {
                  actual.concluidos += 1
                }

                if (
                  servicio.confirmado_admin ===
                  true
                ) {
                  actual.confirmados += 1
                }

                mapa.set(
                  tecnico.id,
                  actual
                )
              }
            )
          }
        )

        return Array.from(
          mapa.values()
        ).sort(
          (a, b) =>
            b.servicios -
            a.servicios
        )
      },
      [servicios]
    )


  // ==========================================
  // INGRESOS POR DIA
  // ==========================================

  const porDia =
    useMemo(
      () => {
        const mapa = new Map()

        servicios.forEach(
          servicio => {
            const fecha =
              servicio
                ?.citas
                ?.fecha

            if (!fecha) {
              return
            }

            const actual =
              mapa.get(fecha) || {
                fecha,
                servicios: 0,
                ingresos: 0
              }

            actual.servicios += 1
            actual.ingresos +=
              ingresoServicio(
                servicio
              )

            mapa.set(
              fecha,
              actual
            )
          }
        )

        return Array.from(
          mapa.values()
        ).sort(
          (a, b) =>
            a.fecha.localeCompare(
              b.fecha
            )
        )
      },
      [servicios]
    )


  const maxIngresoDia =
    Math.max(
      ...porDia.map(
        item => item.ingresos
      ),
      1
    )


  const maxServiciosTipo =
    Math.max(
      ...porTipoServicio.map(
        item => item.servicios
      ),
      1
    )


  const maxServiciosMunicipio =
    Math.max(
      ...porMunicipio.map(
        item => item.servicios
      ),
      1
    )


  const maxServiciosMaquinaria =
    Math.max(
      ...porMaquinaria.map(
        item => item.servicios
      ),
      1
    )


  // ==========================================
  // FORMAS DE PAGO
  // ==========================================

  const porMetodoPago =
    useMemo(
      () => {
        const mapa = new Map()

        servicios.forEach(
          servicio => {
            pagosPagados(servicio)
              .forEach(
                pago => {
                  const nombre =
                    pago
                      ?.metodos_pago
                      ?.nombre ||
                    'Sin método'

                  const actual =
                    mapa.get(nombre) || {
                      nombre,
                      operaciones: 0,
                      ingresos: 0
                    }

                  actual.operaciones += 1
                  actual.ingresos +=
                    Number(
                      pago.importe || 0
                    )

                  mapa.set(
                    nombre,
                    actual
                  )
                }
              )
          }
        )

        return Array.from(
          mapa.values()
        ).sort(
          (a, b) =>
            b.ingresos -
            a.ingresos
        )
      },
      [servicios]
    )


  // ==========================================
  // EXPORTAR CSV
  // ==========================================

  function escaparCsv(valor) {
    const texto =
      String(
        valor ?? ''
      ).replaceAll(
        '"',
        '""'
      )

    return `"${texto}"`
  }


  function exportarCsv() {
    if (
      servicios.length === 0
    ) {
      window.alert(
        'No hay datos para exportar en este periodo.'
      )
      return
    }

    const encabezados = [
      'Folio',
      'Fecha',
      'Cliente',
      'Municipio',
      'Tipo de servicio',
      'Maquinaria / equipo',
      'Estado',
      'Confirmado admin',
      'Técnico',
      'Método de pago',
      'Importe pagado'
    ]

    const filas =
      servicios.map(
        servicio => {
          const pagos =
            pagosPagados(servicio)

          const metodos =
            pagos
              .map(
                pago =>
                  pago
                    ?.metodos_pago
                    ?.nombre
              )
              .filter(Boolean)
              .join(', ')

          return [
            servicio.folio,
            servicio?.citas?.fecha,
            nombreCliente(servicio),
            nombreMunicipio(servicio),
            nombreTipoServicio(servicio),
            nombresMaquinaria(servicio),
            servicio.estado,
            servicio.confirmado_admin
              ? 'SI'
              : 'NO',
            nombresTecnicos(servicio),
            metodos,
            ingresoServicio(servicio)
          ]
        }
      )

    const contenido = [
      encabezados,
      ...filas
    ]
      .map(
        fila =>
          fila
            .map(escaparCsv)
            .join(';')
      )
      .join('\n')

    const blob =
      new Blob(
        [
          '\ufeff' + contenido
        ],
        {
          type:
            'text/csv;charset=utf-8;'
        }
      )

    const url =
      URL.createObjectURL(blob)

    const enlace =
      document.createElement('a')

    enlace.href = url
    enlace.download =
      `destapa-ya-reporte-${fechaDesde || 'inicio'}-${fechaHasta || 'actual'}.csv`

    document.body.appendChild(
      enlace
    )

    enlace.click()
    enlace.remove()

    URL.revokeObjectURL(url)
  }


  const avanceMensual =
    calcularAvance(
      resumenComercial.ingresosMes,
      cuotaMensual
    )

  const avanceAnual =
    calcularAvance(
      resumenComercial.ingresosAnio,
      cuotaAnual
    )


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="rep-page">

      <header className="rep-header">
        <div>
          <button
            type="button"
            className="rep-back"
            onClick={onVolver}
          >
            ← Volver al Dashboard
          </button>

          <span className="rep-eyebrow">
            INTELIGENCIA DEL NEGOCIO
          </span>

          <h1>
            Reportes
          </h1>

          <p>
            Indicadores comerciales y operativos de DESTAPA YA.
          </p>
        </div>

        <div className="rep-header-actions">
          <button
            type="button"
            onClick={() =>
              window.print()
            }
          >
            🖨 Imprimir
          </button>

          <button
            type="button"
            className="primary"
            onClick={exportarCsv}
          >
            ↓ Exportar CSV
          </button>
        </div>
      </header>


      <main className="rep-content">

        <section className="rep-filter-card">
          <div className="rep-filter-title">
            <div>
              <h2>
                Periodo del reporte
              </h2>

              <p>
                Los indicadores se calculan sobre la fecha del servicio.
              </p>
            </div>

            <div className="rep-presets">
              <button
                type="button"
                onClick={() =>
                  aplicarPeriodo('MES')
                }
              >
                Este mes
              </button>

              <button
                type="button"
                onClick={() =>
                  aplicarPeriodo('30')
                }
              >
                Últimos 30 días
              </button>

              <button
                type="button"
                onClick={() =>
                  aplicarPeriodo('ANIO')
                }
              >
                Este año
              </button>

              <button
                type="button"
                onClick={() =>
                  aplicarPeriodo('TODO')
                }
              >
                Histórico
              </button>
            </div>
          </div>

          <div className="rep-filter-grid">
            <div>
              <label>
                DESDE
              </label>

              <input
                type="date"
                value={fechaDesde}
                onChange={event =>
                  setFechaDesde(
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label>
                HASTA
              </label>

              <input
                type="date"
                value={fechaHasta}
                onChange={event =>
                  setFechaHasta(
                    event.target.value
                  )
                }
              />
            </div>

            <button
              type="button"
              className="rep-apply"
              onClick={() =>
                cargarReportes()
              }
            >
              Aplicar periodo
            </button>
          </div>
        </section>


        <details className="rep-goal-config">
          <summary>
            ⚙ Configurar cuotas comerciales
          </summary>

          <div className="rep-goal-config-body">
            <div>
              <label>
                CUOTA MENSUAL
              </label>

              <input
                type="number"
                min="0"
                step="100"
                value={cuotaMensual}
                onChange={event =>
                  setCuotaMensual(
                    event.target.value
                  )
                }
                placeholder="Ej. 100000"
              />
            </div>

            <div>
              <label>
                CUOTA ANUAL
              </label>

              <input
                type="number"
                min="0"
                step="1000"
                value={cuotaAnual}
                onChange={event =>
                  setCuotaAnual(
                    event.target.value
                  )
                }
                placeholder="Ej. 1200000"
              />
            </div>

            <button
              type="button"
              onClick={guardarCuotas}
            >
              Guardar metas
            </button>
          </div>

          <p>
            Estas metas se guardan en este navegador y permanecen aunque cierres la aplicación.
          </p>
        </details>


        {
          mensaje && (
            <div className="rep-error">
              {mensaje}
            </div>
          )
        }


        {
          cargando
            ? (
              <div className="rep-loading">
                Cargando indicadores...
              </div>
            )
            : (
              <>

                <section className="rep-commercial-summary">
                  <div className="rep-section-heading">
                    <div>
                      <span>RESUMEN EJECUTIVO</span>
                      <h2>
                        Avance comercial actual
                      </h2>
                    </div>

                    <small>
                      Independiente del filtro del reporte
                    </small>
                  </div>

                  <div className="rep-period-grid">
                    <article className="rep-period-card">
                      <div className="rep-period-top">
                        <div>
                          <span>ESTE MES</span>
                          <strong>
                            {
                              new Intl.DateTimeFormat(
                                'es-MX',
                                {
                                  month: 'long',
                                  year: 'numeric'
                                }
                              ).format(
                                new Date()
                              )
                            }
                          </strong>
                        </div>

                        <div className="rep-period-percent">
                          {
                            cuotaMensual > 0
                              ? formatearPorcentaje(
                                  avanceMensual
                                )
                              : '—'
                          }
                        </div>
                      </div>

                      <div className="rep-period-service-count">
                        <span>
                          Servicios realizados
                        </span>

                        <strong>
                          {
                            resumenComercial
                              .serviciosMes
                          }
                        </strong>
                      </div>

                      <div className="rep-period-finance">
                        <div>
                          <span>Ingresos</span>
                          <strong>
                            {
                              formatearMoneda(
                                resumenComercial
                                  .ingresosMes
                              )
                            }
                          </strong>
                        </div>

                        <div>
                          <span>Gastos</span>
                          <strong>
                            {
                              formatearMoneda(
                                resumenComercial
                                  .gastosMes
                              )
                            }
                          </strong>
                        </div>

                        <div className="utility">
                          <span>Utilidad</span>
                          <strong>
                            {
                              formatearMoneda(
                                resumenComercial
                                  .utilidadMes
                              )
                            }
                          </strong>
                        </div>
                      </div>

                      <div className="rep-margin-line">
                        <span>
                          Margen de utilidad
                        </span>

                        <strong>
                          {
                            formatearPorcentaje(
                              resumenComercial
                                .margenMes
                            )
                          }
                        </strong>
                      </div>

                      <div className="rep-goal-line">
                        <span>
                          {
                            cuotaMensual > 0
                              ? `Meta: ${formatearMoneda(
                                  cuotaMensual
                                )}`
                              : 'Define la cuota mensual'
                          }
                        </span>

                        {
                          cuotaMensual > 0 && (
                            <strong>
                              {
                                formatearMoneda(
                                  Math.max(
                                    Number(
                                      cuotaMensual || 0
                                    ) -
                                    resumenComercial
                                      .ingresosMes,
                                    0
                                  )
                                )
                              } restantes
                            </strong>
                          )
                        }
                      </div>

                      <div className="rep-goal-track">
                        <div
                          className="rep-goal-fill"
                          style={{
                            width:
                              `${Math.min(
                                avanceMensual,
                                100
                              )}%`
                          }}
                        />
                      </div>
                    </article>


                    <article className="rep-period-card annual">
                      <div className="rep-period-top">
                        <div>
                          <span>ACUMULADO ANUAL</span>
                          <strong>
                            {new Date().getFullYear()}
                          </strong>
                        </div>

                        <div className="rep-period-percent">
                          {
                            cuotaAnual > 0
                              ? formatearPorcentaje(
                                  avanceAnual
                                )
                              : '—'
                          }
                        </div>
                      </div>

                      <div className="rep-period-service-count">
                        <span>
                          Servicios realizados
                        </span>

                        <strong>
                          {
                            resumenComercial
                              .serviciosAnio
                          }
                        </strong>
                      </div>

                      <div className="rep-period-finance">
                        <div>
                          <span>Ingresos</span>
                          <strong>
                            {
                              formatearMoneda(
                                resumenComercial
                                  .ingresosAnio
                              )
                            }
                          </strong>
                        </div>

                        <div>
                          <span>Gastos</span>
                          <strong>
                            {
                              formatearMoneda(
                                resumenComercial
                                  .gastosAnio
                              )
                            }
                          </strong>
                        </div>

                        <div className="utility">
                          <span>Utilidad</span>
                          <strong>
                            {
                              formatearMoneda(
                                resumenComercial
                                  .utilidadAnio
                              )
                            }
                          </strong>
                        </div>
                      </div>

                      <div className="rep-margin-line">
                        <span>
                          Margen de utilidad
                        </span>

                        <strong>
                          {
                            formatearPorcentaje(
                              resumenComercial
                                .margenAnio
                            )
                          }
                        </strong>
                      </div>

                      <div className="rep-goal-line">
                        <span>
                          {
                            cuotaAnual > 0
                              ? `Meta: ${formatearMoneda(
                                  cuotaAnual
                                )}`
                              : 'Define la cuota anual'
                          }
                        </span>

                        {
                          cuotaAnual > 0 && (
                            <strong>
                              {
                                formatearMoneda(
                                  Math.max(
                                    Number(
                                      cuotaAnual || 0
                                    ) -
                                    resumenComercial
                                      .ingresosAnio,
                                    0
                                  )
                                )
                              } restantes
                            </strong>
                          )
                        }
                      </div>

                      <div className="rep-goal-track">
                        <div
                          className="rep-goal-fill"
                          style={{
                            width:
                              `${Math.min(
                                avanceAnual,
                                100
                              )}%`
                          }}
                        />
                      </div>
                    </article>
                  </div>
                </section>


                <div className="rep-section-heading compact">
                  <div>
                    <span>PERIODO SELECCIONADO</span>
                    <h2>
                      Resultado financiero del periodo
                    </h2>
                  </div>

                  <small>
                    {
                      fechaDesde || fechaHasta
                        ? `${fechaDesde ? formatearFecha(fechaDesde) : 'Inicio'} — ${fechaHasta ? formatearFecha(fechaHasta) : 'Actual'}`
                        : 'Histórico completo'
                    }
                  </small>
                </div>

                <section className="rep-financial-strip">

                  <article className="rep-financial-item income">
                    <span>
                      INGRESOS
                    </span>

                    <strong>
                      {
                        formatearMoneda(
                          resumen.ingresos
                        )
                      }
                    </strong>

                    <small>
                      Pagos cobrados en el periodo
                    </small>
                  </article>


                  <article className="rep-financial-item expense">
                    <span>
                      GASTOS
                    </span>

                    <strong>
                      {
                        formatearMoneda(
                          resumen.gastos
                        )
                      }
                    </strong>

                    <small>
                      Gastos registrados en el periodo
                    </small>
                  </article>


                  <article
                    className={
                      `rep-financial-item utility ${
                        resumen.utilidad < 0
                          ? 'negative'
                          : ''
                      }`
                    }
                  >
                    <span>
                      UTILIDAD
                    </span>

                    <strong>
                      {
                        formatearMoneda(
                          resumen.utilidad
                        )
                      }
                    </strong>

                    <small>
                      Ingresos menos gastos
                    </small>
                  </article>


                  <article className="rep-financial-item margin">
                    <span>
                      MARGEN
                    </span>

                    <strong>
                      {
                        formatearPorcentaje(
                          resumen.margen
                        )
                      }
                    </strong>

                    <small>
                      Utilidad sobre ingresos
                    </small>
                  </article>

                </section>


                <div className="rep-section-heading compact operational">
                  <div>
                    <span>OPERACIÓN</span>
                    <h2>
                      Indicadores operativos
                    </h2>
                  </div>
                </div>


                <section className="rep-kpis rep-kpis-operational">
                  <div className="rep-kpi">
                    <span>
                      Servicios
                    </span>
                    <strong>
                      {resumen.total}
                    </strong>
                    <small>
                      En el periodo
                    </small>
                  </div>

                  <div className="rep-kpi">
                    <span>
                      Ticket promedio
                    </span>
                    <strong>
                      {
                        formatearMoneda(
                          resumen.ticketPromedio
                        )
                      }
                    </strong>
                    <small>
                      Por servicio pagado
                    </small>
                  </div>

                  <div className="rep-kpi">
                    <span>
                      Clientes únicos
                    </span>
                    <strong>
                      {resumen.clientesUnicos}
                    </strong>
                    <small>
                      Atendidos
                    </small>
                  </div>

                  <div className="rep-kpi">
                    <span>
                      Concluidos
                    </span>
                    <strong>
                      {resumen.concluidos}
                    </strong>
                    <small>
                      Operativamente
                    </small>
                  </div>

                  <div className="rep-kpi">
                    <span>
                      Municipios atendidos
                    </span>
                    <strong>
                      {resumen.municipiosUnicos}
                    </strong>
                    <small>
                      Cobertura en el periodo
                    </small>
                  </div>

                  <div className="rep-kpi">
                    <span>
                      Maquinaria utilizada
                    </span>
                    <strong>
                      {resumen.maquinariasUnicas}
                    </strong>
                    <small>
                      Tipos de equipo distintos
                    </small>
                  </div>

                  <div className="rep-kpi highlight">
                    <span>
                      Confirmados
                    </span>
                    <strong>
                      {resumen.confirmados}
                    </strong>
                    <small>
                      Cierre administrativo
                    </small>
                  </div>
                </section>


                <section className="rep-two-columns">

                  <article className="rep-card">
                    <div className="rep-card-header">
                      <div>
                        <h3>
                          Ingresos por día
                        </h3>
                        <p>
                          Servicios e importe registrado.
                        </p>
                      </div>
                    </div>

                    {
                      porDia.length === 0
                        ? (
                          <div className="rep-empty">
                            Sin información en este periodo.
                          </div>
                        )
                        : (
                          <div className="rep-bars">
                            {
                              porDia.map(
                                item => (
                                  <div
                                    className="rep-bar-row"
                                    key={item.fecha}
                                  >
                                    <div className="rep-bar-label">
                                      <strong>
                                        {
                                          formatearFecha(
                                            item.fecha
                                          )
                                        }
                                      </strong>
                                      <span>
                                        {item.servicios} servicio(s)
                                      </span>
                                    </div>

                                    <div className="rep-bar-track">
                                      <div
                                        className="rep-bar-fill"
                                        style={{
                                          width:
                                            `${Math.max(
                                              (item.ingresos /
                                                maxIngresoDia) *
                                                100,
                                              item.ingresos > 0
                                                ? 4
                                                : 0
                                            )}%`
                                        }}
                                      />
                                    </div>

                                    <strong className="rep-bar-value">
                                      {
                                        formatearMoneda(
                                          item.ingresos
                                        )
                                      }
                                    </strong>
                                  </div>
                                )
                              )
                            }
                          </div>
                        )
                    }
                  </article>


                  <article className="rep-card">
                    <div className="rep-card-header">
                      <div>
                        <h3>
                          Servicios más solicitados
                        </h3>
                        <p>
                          Ranking por cantidad de servicios.
                        </p>
                      </div>
                    </div>

                    {
                      porTipoServicio.length === 0
                        ? (
                          <div className="rep-empty">
                            Sin información.
                          </div>
                        )
                        : (
                          <div className="rep-bars">
                            {
                              porTipoServicio.map(
                                item => (
                                  <div
                                    className="rep-bar-row"
                                    key={item.nombre}
                                  >
                                    <div className="rep-bar-label">
                                      <strong>
                                        {item.nombre}
                                      </strong>
                                      <span>
                                        {
                                          formatearMoneda(
                                            item.ingresos
                                          )
                                        }
                                      </span>
                                    </div>

                                    <div className="rep-bar-track">
                                      <div
                                        className="rep-bar-fill"
                                        style={{
                                          width:
                                            `${Math.max(
                                              (item.servicios /
                                                maxServiciosTipo) *
                                                100,
                                              4
                                            )}%`
                                        }}
                                      />
                                    </div>

                                    <strong className="rep-bar-value">
                                      {item.servicios}
                                    </strong>
                                  </div>
                                )
                              )
                            }
                          </div>
                        )
                    }
                  </article>

                </section>


                <section className="rep-two-columns">

                  <article className="rep-card">
                    <div className="rep-card-header">
                      <div>
                        <h3>
                          Servicios por municipio
                        </h3>
                        <p>
                          Distribución geográfica de los servicios realizados.
                        </p>
                      </div>
                    </div>

                    {
                      porMunicipio.length === 0
                        ? (
                          <div className="rep-empty">
                            Sin información de municipio.
                          </div>
                        )
                        : (
                          <div className="rep-bars">
                            {
                              porMunicipio.map(
                                item => (
                                  <div
                                    className="rep-bar-row"
                                    key={item.nombre}
                                  >
                                    <div className="rep-bar-label">
                                      <strong>
                                        {item.nombre}
                                      </strong>
                                      <span>
                                        {
                                          formatearMoneda(
                                            item.ingresos
                                          )
                                        }
                                      </span>
                                    </div>

                                    <div className="rep-bar-track">
                                      <div
                                        className="rep-bar-fill"
                                        style={{
                                          width:
                                            `${Math.max(
                                              (item.servicios /
                                                maxServiciosMunicipio) *
                                                100,
                                              4
                                            )}%`
                                        }}
                                      />
                                    </div>

                                    <strong className="rep-bar-value">
                                      {item.servicios}
                                    </strong>
                                  </div>
                                )
                              )
                            }
                          </div>
                        )
                    }
                  </article>


                  <article className="rep-card">
                    <div className="rep-card-header">
                      <div>
                        <h3>
                          Maquinaria / equipo utilizado
                        </h3>
                        <p>
                          Número de servicios en los que se utilizó cada equipo.
                        </p>
                      </div>
                    </div>

                    {
                      porMaquinaria.length === 0
                        ? (
                          <div className="rep-empty">
                            Sin maquinaria registrada en este periodo.
                          </div>
                        )
                        : (
                          <div className="rep-bars">
                            {
                              porMaquinaria.map(
                                item => (
                                  <div
                                    className="rep-bar-row"
                                    key={item.id}
                                  >
                                    <div className="rep-bar-label">
                                      <strong>
                                        {item.nombre}
                                      </strong>
                                      <span>
                                        Servicios con este equipo
                                      </span>
                                    </div>

                                    <div className="rep-bar-track">
                                      <div
                                        className="rep-bar-fill"
                                        style={{
                                          width:
                                            `${Math.max(
                                              (item.servicios /
                                                maxServiciosMaquinaria) *
                                                100,
                                              4
                                            )}%`
                                        }}
                                      />
                                    </div>

                                    <strong className="rep-bar-value">
                                      {item.servicios}
                                    </strong>
                                  </div>
                                )
                              )
                            }
                          </div>
                        )
                    }
                  </article>

                </section>


                <section className="rep-two-columns">
                  <article className="rep-card">
                    <div className="rep-card-header">
                      <div>
                        <h3>
                          Mejores clientes
                        </h3>
                        <p>
                          Ordenados por ingreso registrado.
                        </p>
                      </div>
                    </div>

                    <div className="rep-table-wrap">
                      <table className="rep-table">
                        <thead>
                          <tr>
                            <th>CLIENTE</th>
                            <th>SERVICIOS</th>
                            <th>INGRESOS</th>
                          </tr>
                        </thead>

                        <tbody>
                          {
                            topClientes.length === 0
                              ? (
                                <tr>
                                  <td colSpan="3">
                                    Sin información.
                                  </td>
                                </tr>
                              )
                              : topClientes.map(
                                  cliente => (
                                    <tr key={cliente.id}>
                                      <td>
                                        <strong>
                                          {cliente.nombre}
                                        </strong>
                                      </td>
                                      <td>
                                        {cliente.servicios}
                                      </td>
                                      <td>
                                        <strong>
                                          {
                                            formatearMoneda(
                                              cliente.ingresos
                                            )
                                          }
                                        </strong>
                                      </td>
                                    </tr>
                                  )
                                )
                          }
                        </tbody>
                      </table>
                    </div>
                  </article>


                  <article className="rep-card">
                    <div className="rep-card-header">
                      <div>
                        <h3>
                          Productividad técnica
                        </h3>
                        <p>
                          Servicios asignados por técnico.
                        </p>
                      </div>
                    </div>

                    <div className="rep-table-wrap">
                      <table className="rep-table">
                        <thead>
                          <tr>
                            <th>TÉCNICO</th>
                            <th>SERV.</th>
                            <th>CONCL.</th>
                            <th>CONF.</th>
                          </tr>
                        </thead>

                        <tbody>
                          {
                            productividadTecnicos.length === 0
                              ? (
                                <tr>
                                  <td colSpan="4">
                                    Sin información.
                                  </td>
                                </tr>
                              )
                              : productividadTecnicos.map(
                                  tecnico => (
                                    <tr key={tecnico.id}>
                                      <td>
                                        <strong>
                                          {tecnico.nombre}
                                        </strong>
                                      </td>
                                      <td>
                                        {tecnico.servicios}
                                      </td>
                                      <td>
                                        {tecnico.concluidos}
                                      </td>
                                      <td>
                                        {tecnico.confirmados}
                                      </td>
                                    </tr>
                                  )
                                )
                          }
                        </tbody>
                      </table>
                    </div>
                  </article>
                </section>


                <section className="rep-two-columns">
                  <article className="rep-card">
                    <div className="rep-card-header">
                      <div>
                        <h3>
                          Formas de pago
                        </h3>
                        <p>
                          Distribución de ingresos registrados.
                        </p>
                      </div>
                    </div>

                    <div className="rep-payment-list">
                      {
                        porMetodoPago.length === 0
                          ? (
                            <div className="rep-empty">
                              Sin pagos registrados.
                            </div>
                          )
                          : porMetodoPago.map(
                              metodo => (
                                <div
                                  className="rep-payment-row"
                                  key={metodo.nombre}
                                >
                                  <div>
                                    <strong>
                                      {metodo.nombre}
                                    </strong>
                                    <span>
                                      {metodo.operaciones} operación(es)
                                    </span>
                                  </div>

                                  <strong>
                                    {
                                      formatearMoneda(
                                        metodo.ingresos
                                      )
                                    }
                                  </strong>
                                </div>
                              )
                            )
                      }
                    </div>
                  </article>


                  <article className="rep-card">
                    <div className="rep-card-header">
                      <div>
                        <h3>
                          Resumen ejecutivo
                        </h3>
                        <p>
                          Lectura rápida del periodo.
                        </p>
                      </div>
                    </div>

                    <div className="rep-summary-list">
                      <div>
                        <span>
                          Periodo
                        </span>
                        <strong>
                          {
                            fechaDesde ||
                            fechaHasta
                              ? `${fechaDesde ? formatearFecha(fechaDesde) : 'Inicio'} — ${fechaHasta ? formatearFecha(fechaHasta) : 'Actualidad'}`
                              : 'Histórico completo'
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Tasa de confirmación
                        </span>
                        <strong>
                          {
                            resumen.total > 0
                              ? `${Math.round(
                                  (resumen.confirmados /
                                    resumen.total) *
                                    100
                                )}%`
                              : '0%'
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Servicio líder
                        </span>
                        <strong>
                          {
                            porTipoServicio[0]
                              ?.nombre ||
                            '—'
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Cliente principal
                        </span>
                        <strong>
                          {
                            topClientes[0]
                              ?.nombre ||
                            '—'
                          }
                        </strong>
                      </div>
                    </div>
                  </article>
                </section>


                <section className="rep-card rep-full">
                  <div className="rep-card-header">
                    <div>
                      <h3>
                        Detalle de servicios
                      </h3>
                      <p>
                        Base del reporte para validación y exportación.
                      </p>
                    </div>

                    <strong className="rep-counter">
                      {servicios.length}
                    </strong>
                  </div>

                  <div className="rep-table-wrap">
                    <table className="rep-table rep-detail-table">
                      <thead>
                        <tr>
                          <th>FOLIO</th>
                          <th>FECHA</th>
                          <th>CLIENTE</th>
                          <th>SERVICIO</th>
                          <th>TÉCNICO</th>
                          <th>ESTADO</th>
                          <th>IMPORTE</th>
                        </tr>
                      </thead>

                      <tbody>
                        {
                          servicios.length === 0
                            ? (
                              <tr>
                                <td colSpan="7">
                                  No hay servicios en el periodo seleccionado.
                                </td>
                              </tr>
                            )
                            : servicios.map(
                                servicio => (
                                  <tr key={servicio.id}>
                                    <td>
                                      <strong className="rep-folio">
                                        {servicio.folio}
                                      </strong>
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
                                      {
                                        nombreCliente(
                                          servicio
                                        )
                                      }
                                    </td>

                                    <td>
                                      {
                                        nombreTipoServicio(
                                          servicio
                                        )
                                      }
                                    </td>

                                    <td>
                                      {
                                        nombresTecnicos(
                                          servicio
                                        )
                                      }
                                    </td>

                                    <td>
                                      <span
                                        className={
                                          `rep-status ${
                                            servicio.confirmado_admin
                                              ? 'confirmado'
                                              : String(
                                                  servicio.estado || ''
                                                )
                                                  .toLowerCase()
                                                  .replaceAll('_', '-')
                                          }`
                                        }
                                      >
                                        {
                                          servicio.confirmado_admin
                                            ? 'CONFIRMADO'
                                            : String(
                                                servicio.estado || '—'
                                              ).replaceAll('_', ' ')
                                        }
                                      </span>
                                    </td>

                                    <td>
                                      <strong>
                                        {
                                          formatearMoneda(
                                            ingresoServicio(
                                              servicio
                                            )
                                          )
                                        }
                                      </strong>
                                    </td>
                                  </tr>
                                )
                              )
                        }
                      </tbody>
                    </table>
                  </div>
                </section>

              </>
            )
        }

      </main>
    </div>
  )
}


export default Reportes