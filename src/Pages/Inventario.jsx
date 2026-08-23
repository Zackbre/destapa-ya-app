import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { supabase } from '../supabase'
import './Inventario.css'


const CATEGORIAS = [
  {
    value: 'MAQUINARIA',
    label: 'Maquinaria'
  },
  {
    value: 'HERRAMIENTA',
    label: 'Herramienta'
  },
  {
    value: 'ACCESORIO',
    label: 'Accesorio'
  },
  {
    value: 'OTRO',
    label: 'Otro'
  }
]


const ESTADOS = [
  {
    value: 'DISPONIBLE',
    label: 'Disponible'
  },
  {
    value: 'EN_USO',
    label: 'En uso'
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
    nombre: '',
    descripcion: '',
    categoria: 'HERRAMIENTA',
    marca: '',
    modelo: '',
    numero_serie: '',
    cantidad_total: '1',
    cantidad_disponible: '1',
    ubicacion: '',
    estado_operativo: 'DISPONIBLE',
    costo_adquisicion: '',
    fecha_compra: '',
    ultimo_mantenimiento: '',
    proximo_mantenimiento: '',
    activo: true,
    notas: ''
  }
}


function obtenerFechaLocal(fecha = new Date()) {
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


function obtenerInicioMes() {
  const hoy =
    new Date()

  return obtenerFechaLocal(
    new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    )
  )
}


function Inventario({ onVolver }) {

  const [herramientas, setHerramientas] =
    useState([])

  const [usos, setUsos] =
    useState([])

  const [cargando, setCargando] =
    useState(true)

  const [guardando, setGuardando] =
    useState(false)

  const [mensaje, setMensaje] =
    useState('')

  const [busqueda, setBusqueda] =
    useState('')

  const [filtroCategoria, setFiltroCategoria] =
    useState('TODAS')

  const [filtroEstado, setFiltroEstado] =
    useState('TODOS')

  const [filtroActivo, setFiltroActivo] =
    useState('ACTIVOS')

  const [
    mostrandoFormulario,
    setMostrandoFormulario
  ] = useState(false)

  const [
    herramientaEditando,
    setHerramientaEditando
  ] = useState(null)

  const [formulario, setFormulario] =
    useState(formularioVacio())

  const [
    herramientaSeleccionada,
    setHerramientaSeleccionada
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
        herramientasResultado,
        usosResultado
      ] =
        await Promise.all([

          supabase
            .from('herramientas')
            .select(`
              id,
              nombre,
              descripcion,
              activo,
              categoria,
              marca,
              modelo,
              numero_serie,
              cantidad_total,
              cantidad_disponible,
              ubicacion,
              estado_operativo,
              costo_adquisicion,
              fecha_compra,
              ultimo_mantenimiento,
              proximo_mantenimiento,
              notas,
              created_at,
              updated_at
            `)
            .order(
              'nombre',
              {
                ascending: true
              }
            ),

          supabase
            .from('servicios_herramientas')
            .select(`
              id,
              herramienta_id,
              observaciones,

              herramientas (
                id,
                nombre
              ),

              servicios (
                id,
                folio,
                estado,
                fecha_inicio,
                fecha_conclusion,

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
              )
            `)
            .order(
              'id',
              {
                ascending: false
              }
            )
        ])


      if (
        herramientasResultado.error
      ) {
        throw herramientasResultado.error
      }


      if (
        usosResultado.error
      ) {
        throw usosResultado.error
      }


      setHerramientas(
        herramientasResultado.data ||
        []
      )

      setUsos(
        usosResultado.data ||
        []
      )

    } catch (error) {

      console.error(
        'Error cargando inventario:',
        error
      )

      setMensaje(
        'No fue posible cargar Herramientas e Inventario. ' +
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
      Number(
        valor || 0
      )
    )
  }


  function formatearNumero(valor) {

    return new Intl.NumberFormat(
      'es-MX'
    ).format(
      Number(
        valor || 0
      )
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


  function categoriaLabel(valor) {

    return (
      CATEGORIAS.find(
        item =>
          item.value ===
          valor
      )?.label ||
      valor ||
      'Sin categoría'
    )
  }


  function estadoLabel(valor) {

    return (
      ESTADOS.find(
        item =>
          item.value ===
          valor
      )?.label ||
      valor ||
      'Sin estado'
    )
  }


  // ==========================================
  // USOS
  // ==========================================

  function usosHerramienta(
    herramientaId
  ) {

    return usos.filter(
      uso =>
        Number(
          uso.herramienta_id
        ) ===
        Number(
          herramientaId
        )
    )
  }


  function obtenerFechaUso(
    uso
  ) {

    return (
      uso
        ?.servicios
        ?.citas
        ?.fecha ||
      (
        uso
          ?.servicios
          ?.fecha_conclusion
          ? String(
              uso
                .servicios
                .fecha_conclusion
            )
              .split('T')[0]
          : ''
      ) ||
      (
        uso
          ?.servicios
          ?.fecha_inicio
          ? String(
              uso
                .servicios
                .fecha_inicio
            )
              .split('T')[0]
          : ''
      )
    )
  }


  function usosMesHerramienta(
    herramientaId
  ) {

    const inicio =
      obtenerInicioMes()

    return usosHerramienta(
      herramientaId
    ).filter(
      uso => {

        const fecha =
          obtenerFechaUso(
            uso
          )

        return (
          fecha &&
          fecha >=
            inicio
        )
      }
    ).length
  }


  // ==========================================
  // KPI
  // ==========================================

  const kpis =
    useMemo(
      () => {

        const activos =
          herramientas.filter(
            item =>
              item.activo !==
              false
          )

        const disponibles =
          activos.filter(
            item =>
              (
                item.estado_operativo ||
                'DISPONIBLE'
              ) ===
              'DISPONIBLE'
          ).length

        const mantenimiento =
          activos.filter(
            item =>
              item.estado_operativo ===
              'MANTENIMIENTO'
          ).length

        const fueraServicio =
          activos.filter(
            item =>
              item.estado_operativo ===
              'FUERA_DE_SERVICIO'
          ).length

        const valorInventario =
          activos.reduce(
            (
              total,
              item
            ) =>
              total +
              (
                Number(
                  item.costo_adquisicion ||
                  0
                ) *
                Math.max(
                  Number(
                    item.cantidad_total ||
                    1
                  ),
                  1
                )
              ),
            0
          )

        const inicioMes =
          obtenerInicioMes()

        const usosMes =
          usos.filter(
            uso => {

              const fecha =
                obtenerFechaUso(
                  uso
                )

              return (
                fecha &&
                fecha >=
                  inicioMes
              )
            }
          ).length

        return {
          activos:
            activos.length,
          disponibles,
          mantenimiento,
          fueraServicio,
          valorInventario,
          usosMes
        }
      },
      [
        herramientas,
        usos
      ]
    )


  // ==========================================
  // FILTROS
  // ==========================================

  const herramientasFiltradas =
    useMemo(
      () => {

        const texto =
          busqueda
            .trim()
            .toLowerCase()

        return herramientas.filter(
          item => {

            const coincideTexto =
              !texto ||
              [
                item.nombre,
                item.descripcion,
                item.marca,
                item.modelo,
                item.numero_serie,
                item.ubicacion
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(texto)

            const coincideCategoria =
              filtroCategoria ===
                'TODAS' ||
              item.categoria ===
                filtroCategoria

            const coincideEstado =
              filtroEstado ===
                'TODOS' ||
              (
                item.estado_operativo ||
                'DISPONIBLE'
              ) ===
                filtroEstado

            const coincideActivo =
              filtroActivo ===
                'TODOS' ||
              (
                filtroActivo ===
                  'ACTIVOS' &&
                item.activo !==
                  false
              ) ||
              (
                filtroActivo ===
                  'INACTIVOS' &&
                item.activo ===
                  false
              )

            return (
              coincideTexto &&
              coincideCategoria &&
              coincideEstado &&
              coincideActivo
            )
          }
        )
      },
      [
        herramientas,
        busqueda,
        filtroCategoria,
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


  function nuevaHerramienta() {

    setHerramientaEditando(
      null
    )

    setFormulario(
      formularioVacio()
    )

    setMostrandoFormulario(
      true
    )

    setMensaje('')
  }


  function editarHerramienta(
    herramienta
  ) {

    setHerramientaEditando(
      herramienta
    )

    setFormulario({

      nombre:
        herramienta.nombre ||
        '',

      descripcion:
        herramienta.descripcion ||
        '',

      categoria:
        herramienta.categoria ||
        'HERRAMIENTA',

      marca:
        herramienta.marca ||
        '',

      modelo:
        herramienta.modelo ||
        '',

      numero_serie:
        herramienta.numero_serie ||
        '',

      cantidad_total:
        herramienta.cantidad_total ??
        1,

      cantidad_disponible:
        herramienta.cantidad_disponible ??
        herramienta.cantidad_total ??
        1,

      ubicacion:
        herramienta.ubicacion ||
        '',

      estado_operativo:
        herramienta.estado_operativo ||
        'DISPONIBLE',

      costo_adquisicion:
        herramienta.costo_adquisicion ??
        '',

      fecha_compra:
        herramienta.fecha_compra ||
        '',

      ultimo_mantenimiento:
        herramienta.ultimo_mantenimiento ||
        '',

      proximo_mantenimiento:
        herramienta.proximo_mantenimiento ||
        '',

      activo:
        herramienta.activo !==
        false,

      notas:
        herramienta.notas ||
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

    setHerramientaEditando(
      null
    )

    setFormulario(
      formularioVacio()
    )
  }


  async function guardarHerramienta(
    evento
  ) {

    evento.preventDefault()

    if (
      !formulario
        .nombre
        .trim()
    ) {

      window.alert(
        'Escribe el nombre de la herramienta o maquinaria.'
      )

      return
    }


    const cantidadTotal =
      Math.max(
        Number(
          formulario.cantidad_total ||
          1
        ),
        1
      )


    const cantidadDisponible =
      Math.min(
        Math.max(
          Number(
            formulario
              .cantidad_disponible ||
            0
          ),
          0
        ),
        cantidadTotal
      )


    const datos = {

      nombre:
        formulario.nombre
          .trim(),

      descripcion:
        formulario.descripcion
          .trim() ||
        null,

      categoria:
        formulario.categoria,

      marca:
        formulario.marca
          .trim() ||
        null,

      modelo:
        formulario.modelo
          .trim() ||
        null,

      numero_serie:
        formulario.numero_serie
          .trim() ||
        null,

      cantidad_total:
        cantidadTotal,

      cantidad_disponible:
        cantidadDisponible,

      ubicacion:
        formulario.ubicacion
          .trim() ||
        null,

      estado_operativo:
        formulario
          .estado_operativo,

      costo_adquisicion:
        formulario.costo_adquisicion !==
          ''
          ? Number(
              formulario
                .costo_adquisicion
            )
          : null,

      fecha_compra:
        formulario.fecha_compra ||
        null,

      ultimo_mantenimiento:
        formulario
          .ultimo_mantenimiento ||
        null,

      proximo_mantenimiento:
        formulario
          .proximo_mantenimiento ||
        null,

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

      if (
        herramientaEditando
      ) {

        const {
          error
        } =
          await supabase
            .from(
              'herramientas'
            )
            .update(
              datos
            )
            .eq(
              'id',
              herramientaEditando.id
            )

        if (error) {
          throw error
        }

      } else {

        const {
          error
        } =
          await supabase
            .from(
              'herramientas'
            )
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

      setHerramientaEditando(
        null
      )

      setFormulario(
        formularioVacio()
      )

      await cargarTodo()

    } catch (error) {

      console.error(
        'Error guardando herramienta:',
        error
      )

      setMensaje(
        'No fue posible guardar la herramienta: ' +
        error.message
      )

    } finally {
      setGuardando(false)
    }
  }


  async function cambiarActivo(
    herramienta
  ) {

    const nuevoValor =
      herramienta.activo ===
      false

    const confirmar =
      window.confirm(
        nuevoValor
          ? `¿Reactivar "${herramienta.nombre}"? Volverá a aparecer para los técnicos.`
          : `¿Desactivar "${herramienta.nombre}"? Ya no aparecerá para nuevos servicios, pero su historial se conservará.`
      )

    if (!confirmar) {
      return
    }


    try {

      const {
        error
      } =
        await supabase
          .from(
            'herramientas'
          )
          .update({
            activo:
              nuevoValor,
            updated_at:
              new Date()
                .toISOString()
          })
          .eq(
            'id',
            herramienta.id
          )

      if (error) {
        throw error
      }


      await cargarTodo()

    } catch (error) {

      console.error(
        'Error cambiando herramienta:',
        error
      )

      window.alert(
        'No fue posible actualizar la herramienta: ' +
        error.message
      )
    }
  }


  // ==========================================
  // EXPEDIENTE
  // ==========================================

  function abrirExpediente(
    herramienta
  ) {

    setHerramientaSeleccionada(
      herramienta
    )
  }


  function cerrarExpediente() {

    setHerramientaSeleccionada(
      null
    )
  }


  const detalleSeleccionado =
    useMemo(
      () => {

        if (
          !herramientaSeleccionada
        ) {
          return null
        }

        const historial =
          usosHerramienta(
            herramientaSeleccionada.id
          )

        const inicioMes =
          obtenerInicioMes()

        const usosMes =
          historial.filter(
            uso => {

              const fecha =
                obtenerFechaUso(
                  uso
                )

              return (
                fecha &&
                fecha >=
                  inicioMes
              )
            }
          ).length

        return {
          historial,
          usosMes,
          usosTotales:
            historial.length
        }
      },
      [
        herramientaSeleccionada,
        usos
      ]
    )


  // ==========================================
  // MANTENIMIENTO
  // ==========================================

  function estadoMantenimiento(
    herramienta
  ) {

    if (
      !herramienta
        .proximo_mantenimiento
    ) {
      return null
    }


    const hoy =
      new Date(
        `${obtenerFechaLocal()}T12:00:00`
      )

    const fecha =
      new Date(
        `${herramienta.proximo_mantenimiento}T12:00:00`
      )

    const diferencia =
      Math.ceil(
        (
          fecha -
          hoy
        ) /
        86400000
      )


    if (
      diferencia < 0
    ) {
      return {
        tipo: 'urgent',
        texto:
          `Vencido hace ${Math.abs(
            diferencia
          )} día(s)`
      }
    }


    if (
      diferencia <=
      7
    ) {
      return {
        tipo: 'warning',
        texto:
          `En ${diferencia} día(s)`
      }
    }


    return {
      tipo: '',
      texto:
        formatearFecha(
          herramienta
            .proximo_mantenimiento
        )
    }
  }


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="inv-page">

      <header className="inv-header">

        <div>

          <button
            type="button"
            className="inv-back"
            onClick={
              onVolver
            }
          >
            ← Volver al Dashboard
          </button>

          <span className="inv-eyebrow">
            OPERACIÓN
          </span>

          <h1>
            Herramientas e inventario
          </h1>

          <p>
            Control de maquinaria, herramientas, disponibilidad, mantenimiento y uso por servicio.
          </p>

        </div>


        <button
          type="button"
          className="inv-new-button"
          onClick={
            nuevaHerramienta
          }
        >
          ＋ Nueva herramienta
        </button>

      </header>


      <main className="inv-content">

        {
          mensaje && (
            <div className="inv-message">
              {mensaje}
            </div>
          )
        }


        <section className="inv-kpis">

          <article className="inv-kpi inv-kpi-main">

            <span>
              Activos
            </span>

            <strong>
              {kpis.activos}
            </strong>

            <small>
              Herramientas disponibles en catálogo
            </small>

          </article>


          <article className="inv-kpi">

            <span>
              Disponibles
            </span>

            <strong>
              {kpis.disponibles}
            </strong>

            <small>
              Listos para trabajo
            </small>

          </article>


          <article className="inv-kpi">

            <span>
              Mantenimiento
            </span>

            <strong>
              {kpis.mantenimiento}
            </strong>

            <small>
              Equipos detenidos
            </small>

          </article>


          <article className="inv-kpi">

            <span>
              Usos este mes
            </span>

            <strong>
              {kpis.usosMes}
            </strong>

            <small>
              Registros en servicios
            </small>

          </article>


          <article className="inv-kpi">

            <span>
              Valor inventario
            </span>

            <strong className="money">
              {
                formatearMoneda(
                  kpis.valorInventario
                )
              }
            </strong>

            <small>
              Costo de adquisición registrado
            </small>

          </article>

        </section>


        <section className="inv-toolbar">

          <label className="inv-search">

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
              placeholder="Nombre, marca, modelo, serie, ubicación..."
            />

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
                  item => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )
              }

            </select>

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
                  item => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
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
            className="inv-refresh"
            onClick={
              cargarTodo
            }
          >
            ↻ Actualizar
          </button>

        </section>


        <section className="inv-list-card">

          <div className="inv-list-header">

            <div>

              <h2>
                Inventario
              </h2>

              <p>
                {
                  herramientasFiltradas
                    .length
                } registro(s)
              </p>

            </div>

          </div>


          {
            cargando
              ? (
                <div className="inv-empty">
                  Cargando inventario...
                </div>
              )
              : herramientasFiltradas
                  .length === 0
                ? (
                  <div className="inv-empty">

                    <div>
                      🧰
                    </div>

                    <h3>
                      Sin herramientas
                    </h3>

                    <p>
                      Agrega una herramienta o cambia los filtros.
                    </p>

                  </div>
                )
                : (
                  <div className="inv-grid">

                    {
                      herramientasFiltradas.map(
                        herramienta => {

                          const mantenimiento =
                            estadoMantenimiento(
                              herramienta
                            )

                          return (
                            <article
                              key={
                                herramienta.id
                              }
                              className={
                                `inv-card ${
                                  herramienta.activo ===
                                    false
                                    ? 'inactive'
                                    : ''
                                }`
                              }
                            >

                              <div className="inv-card-top">

                                <div className="inv-tool-icon">
                                  {
                                    herramienta.categoria ===
                                      'MAQUINARIA'
                                      ? '⚙️'
                                      : '🧰'
                                  }
                                </div>


                                <div className="inv-title-wrap">

                                  <span className="inv-category-label">
                                    {
                                      categoriaLabel(
                                        herramienta.categoria
                                      )
                                    }
                                  </span>

                                  <h3>
                                    {
                                      herramienta.nombre
                                    }
                                  </h3>

                                  <p>
                                    {
                                      [
                                        herramienta.marca,
                                        herramienta.modelo
                                      ]
                                        .filter(Boolean)
                                        .join(' · ') ||
                                      herramienta.descripcion ||
                                      'Sin descripción'
                                    }
                                  </p>

                                </div>


                                <span
                                  className={
                                    `inv-status ${
                                      (
                                        herramienta
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
                                      herramienta
                                        .estado_operativo
                                    )
                                  }
                                </span>

                              </div>


                              <div className="inv-card-data">

                                <div>

                                  <span>
                                    EXISTENCIA
                                  </span>

                                  <strong>
                                    {
                                      formatearNumero(
                                        herramienta
                                          .cantidad_total ||
                                        1
                                      )
                                    }
                                  </strong>

                                </div>


                                <div>

                                  <span>
                                    DISPONIBLES
                                  </span>

                                  <strong>
                                    {
                                      formatearNumero(
                                        herramienta
                                          .cantidad_disponible ??
                                        herramienta
                                          .cantidad_total ??
                                        1
                                      )
                                    }
                                  </strong>

                                </div>


                                <div>

                                  <span>
                                    USOS MES
                                  </span>

                                  <strong>
                                    {
                                      usosMesHerramienta(
                                        herramienta.id
                                      )
                                    }
                                  </strong>

                                </div>


                                <div>

                                  <span>
                                    USOS HISTÓRICOS
                                  </span>

                                  <strong>
                                    {
                                      usosHerramienta(
                                        herramienta.id
                                      ).length
                                    }
                                  </strong>

                                </div>

                              </div>


                              {
                                herramienta.ubicacion && (

                                  <div className="inv-location">
                                    📍 {
                                      herramienta.ubicacion
                                    }
                                  </div>

                                )
                              }


                              {
                                mantenimiento && (

                                  <div
                                    className={
                                      `inv-maintenance-alert ${
                                        mantenimiento.tipo
                                      }`
                                    }
                                  >

                                    <span>
                                      PRÓXIMO MANTENIMIENTO
                                    </span>

                                    <strong>
                                      {
                                        mantenimiento.texto
                                      }
                                    </strong>

                                  </div>

                                )
                              }


                              <div className="inv-card-actions">

                                <button
                                  type="button"
                                  className="primary"
                                  onClick={() =>
                                    abrirExpediente(
                                      herramienta
                                    )
                                  }
                                >
                                  Ver expediente
                                </button>


                                <button
                                  type="button"
                                  onClick={() =>
                                    editarHerramienta(
                                      herramienta
                                    )
                                  }
                                >
                                  Editar
                                </button>


                                <button
                                  type="button"
                                  className={
                                    herramienta.activo ===
                                      false
                                      ? 'activate'
                                      : 'danger'
                                  }
                                  onClick={() =>
                                    cambiarActivo(
                                      herramienta
                                    )
                                  }
                                >
                                  {
                                    herramienta.activo ===
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
            className="inv-modal-overlay"
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

            <div className="inv-modal">

              <header className="inv-modal-header">

                <div>

                  <span>
                    {
                      herramientaEditando
                        ? 'EDITAR EQUIPO'
                        : 'NUEVO EQUIPO'
                    }
                  </span>

                  <h2>
                    {
                      herramientaEditando
                        ? 'Actualizar herramienta'
                        : 'Registrar herramienta'
                    }
                  </h2>

                  <p>
                    Los registros activos continúan apareciendo automáticamente en la pantalla del técnico al concluir un servicio.
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
                className="inv-form"
                onSubmit={
                  guardarHerramienta
                }
              >

                <div className="inv-form-grid">

                  <label>

                    <span>
                      Nombre *
                    </span>

                    <input
                      type="text"
                      value={
                        formulario.nombre
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'nombre',
                            evento.target.value
                          )
                      }
                      placeholder="Ej. K400, Hidrojet, Cámara..."
                      required
                    />

                  </label>


                  <label>

                    <span>
                      Categoría
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
                          item => (
                            <option
                              key={
                                item.value
                              }
                              value={
                                item.value
                              }
                            >
                              {item.label}
                            </option>
                          )
                        )
                      }
                    </select>

                  </label>


                  <label className="full">

                    <span>
                      Descripción
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
                      placeholder="Descripción breve del equipo y su uso"
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
                    />

                  </label>


                  <label>

                    <span>
                      Número de serie
                    </span>

                    <input
                      type="text"
                      value={
                        formulario.numero_serie
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'numero_serie',
                            evento.target.value
                          )
                      }
                    />

                  </label>


                  <label>

                    <span>
                      Ubicación
                    </span>

                    <input
                      type="text"
                      value={
                        formulario.ubicacion
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'ubicacion',
                            evento.target.value
                          )
                      }
                      placeholder="Ej. Bodega, Unidad 1..."
                    />

                  </label>


                  <label>

                    <span>
                      Existencia total
                    </span>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        formulario
                          .cantidad_total
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'cantidad_total',
                            evento.target.value
                          )
                      }
                    />

                  </label>


                  <label>

                    <span>
                      Cantidad disponible
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        formulario
                          .cantidad_disponible
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'cantidad_disponible',
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
                          item => (
                            <option
                              key={
                                item.value
                              }
                              value={
                                item.value
                              }
                            >
                              {item.label}
                            </option>
                          )
                        )
                      }
                    </select>

                  </label>


                  <label>

                    <span>
                      Costo adquisición
                    </span>

                    <div className="inv-money-input">

                      <span>
                        $
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          formulario
                            .costo_adquisicion
                        }
                        onChange={
                          evento =>
                            cambiarCampo(
                              'costo_adquisicion',
                              evento.target.value
                            )
                        }
                        placeholder="0.00"
                      />

                    </div>

                  </label>


                  <label>

                    <span>
                      Fecha de compra
                    </span>

                    <input
                      type="date"
                      value={
                        formulario
                          .fecha_compra
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'fecha_compra',
                            evento.target.value
                          )
                      }
                    />

                  </label>


                  <label>

                    <span>
                      Último mantenimiento
                    </span>

                    <input
                      type="date"
                      value={
                        formulario
                          .ultimo_mantenimiento
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'ultimo_mantenimiento',
                            evento.target.value
                          )
                      }
                    />

                  </label>


                  <label>

                    <span>
                      Próximo mantenimiento
                    </span>

                    <input
                      type="date"
                      value={
                        formulario
                          .proximo_mantenimiento
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'proximo_mantenimiento',
                            evento.target.value
                          )
                      }
                    />

                  </label>


                  <label className="inv-checkbox-label">

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
                        Activo para servicios
                      </span>

                      <small>
                        Si está activo, el técnico podrá seleccionarlo al ejecutar un servicio.
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
                      placeholder="Accesorios, condición, observaciones, reparaciones pendientes..."
                    />

                  </label>

                </div>


                <div className="inv-form-actions">

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
                        : herramientaEditando
                          ? 'Guardar cambios'
                          : 'Registrar herramienta'
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
        herramientaSeleccionada &&
        detalleSeleccionado && (

          <div
            className="inv-modal-overlay"
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

            <div className="inv-modal inv-detail-modal">

              <header className="inv-modal-header">

                <div>

                  <span>
                    EXPEDIENTE DE HERRAMIENTA
                  </span>

                  <h2>
                    {
                      herramientaSeleccionada
                        .nombre
                    }
                  </h2>

                  <p>
                    {
                      [
                        categoriaLabel(
                          herramientaSeleccionada
                            .categoria
                        ),
                        herramientaSeleccionada
                          .marca,
                        herramientaSeleccionada
                          .modelo
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


              <div className="inv-detail-content">

                <section className="inv-detail-kpis">

                  <article>

                    <span>
                      Usos este mes
                    </span>

                    <strong>
                      {
                        detalleSeleccionado
                          .usosMes
                      }
                    </strong>

                  </article>


                  <article>

                    <span>
                      Usos históricos
                    </span>

                    <strong>
                      {
                        detalleSeleccionado
                          .usosTotales
                      }
                    </strong>

                  </article>


                  <article>

                    <span>
                      Disponibles
                    </span>

                    <strong>
                      {
                        herramientaSeleccionada
                          .cantidad_disponible ??
                        herramientaSeleccionada
                          .cantidad_total ??
                        1
                      }
                    </strong>

                  </article>


                  <article>

                    <span>
                      Valor registrado
                    </span>

                    <strong>
                      {
                        formatearMoneda(
                          (
                            Number(
                              herramientaSeleccionada
                                .costo_adquisicion ||
                              0
                            )
                          ) *
                          Math.max(
                            Number(
                              herramientaSeleccionada
                                .cantidad_total ||
                              1
                            ),
                            1
                          )
                        )
                      }
                    </strong>

                  </article>

                </section>


                <section className="inv-detail-card">

                  <div className="inv-section-header">

                    <div>

                      <h3>
                        Datos del equipo
                      </h3>

                      <p>
                        Identificación y condición operativa
                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={() => {

                        cerrarExpediente()

                        editarHerramienta(
                          herramientaSeleccionada
                        )

                      }}
                    >
                      ✎ Editar
                    </button>

                  </div>


                  <div className="inv-info-grid">

                    <div>
                      <span>
                        CATEGORÍA
                      </span>
                      <strong>
                        {
                          categoriaLabel(
                            herramientaSeleccionada
                              .categoria
                          )
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
                            herramientaSeleccionada
                              .estado_operativo
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        MARCA / MODELO
                      </span>
                      <strong>
                        {
                          [
                            herramientaSeleccionada
                              .marca,
                            herramientaSeleccionada
                              .modelo
                          ]
                            .filter(Boolean)
                            .join(' · ') ||
                          '—'
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        NÚMERO DE SERIE
                      </span>
                      <strong>
                        {
                          herramientaSeleccionada
                            .numero_serie ||
                          '—'
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        UBICACIÓN
                      </span>
                      <strong>
                        {
                          herramientaSeleccionada
                            .ubicacion ||
                          '—'
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        EXISTENCIA
                      </span>
                      <strong>
                        {
                          herramientaSeleccionada
                            .cantidad_total ||
                          1
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        FECHA COMPRA
                      </span>
                      <strong>
                        {
                          formatearFecha(
                            herramientaSeleccionada
                              .fecha_compra
                          )
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
                            herramientaSeleccionada
                              .ultimo_mantenimiento
                          )
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        PRÓXIMO MANTENIMIENTO
                      </span>
                      <strong>
                        {
                          formatearFecha(
                            herramientaSeleccionada
                              .proximo_mantenimiento
                          )
                        }
                      </strong>
                    </div>

                  </div>


                  {
                    herramientaSeleccionada
                      .descripcion && (

                      <div className="inv-notes">

                        <span>
                          DESCRIPCIÓN
                        </span>

                        <p>
                          {
                            herramientaSeleccionada
                              .descripcion
                          }
                        </p>

                      </div>

                    )
                  }


                  {
                    herramientaSeleccionada
                      .notas && (

                      <div className="inv-notes">

                        <span>
                          NOTAS
                        </span>

                        <p>
                          {
                            herramientaSeleccionada
                              .notas
                          }
                        </p>

                      </div>

                    )
                  }

                </section>


                <section className="inv-detail-card">

                  <div className="inv-section-header">

                    <div>

                      <h3>
                        Historial de uso
                      </h3>

                      <p>
                        Servicios en los que fue registrada
                      </p>

                    </div>

                  </div>


                  {
                    detalleSeleccionado
                      .historial
                      .length ===
                      0
                      ? (
                        <div className="inv-detail-empty">
                          Esta herramienta todavía no tiene usos registrados.
                        </div>
                      )
                      : (
                        <div className="inv-history-list">

                          {
                            detalleSeleccionado
                              .historial
                              .slice(
                                0,
                                20
                              )
                              .map(
                                uso => (

                                  <article
                                    key={
                                      uso.id
                                    }
                                  >

                                    <div>

                                      <span>
                                        {
                                          formatearFecha(
                                            obtenerFechaUso(
                                              uso
                                            )
                                          )
                                        }
                                      </span>

                                      <strong>
                                        {
                                          uso
                                            ?.servicios
                                            ?.folio ||
                                          'Servicio'
                                        }
                                      </strong>

                                      <small>
                                        {
                                          uso
                                            ?.servicios
                                            ?.citas
                                            ?.clientes
                                            ?.nombre ||
                                          'Cliente'
                                        }
                                        {' · '}
                                        {
                                          uso
                                            ?.servicios
                                            ?.citas
                                            ?.tipos_servicio
                                            ?.nombre ||
                                          'Servicio'
                                        }
                                      </small>

                                    </div>


                                    <span className="inv-history-status">
                                      {
                                        uso
                                          ?.servicios
                                          ?.estado
                                          ?.replaceAll(
                                            '_',
                                            ' '
                                          ) ||
                                        '—'
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

              </div>

            </div>

          </div>

        )
      }

    </div>
  )
}


export default Inventario