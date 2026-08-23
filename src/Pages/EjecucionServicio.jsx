import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import './EjecucionServicio.css'


const EVIDENCIAS_API =
  import.meta.env.VITE_EVIDENCIAS_API


function EjecucionServicio({
  cita,
  onVolver
}) {

  // ==========================================
  // DATOS DEL SERVICIO
  // ==========================================

  const [diagnostico, setDiagnostico] =
    useState('')

  const [trabajoRealizado, setTrabajoRealizado] =
    useState('')

  const [observaciones, setObservaciones] =
    useState('')

  const [importeFinal, setImporteFinal] =
    useState('')

  const [metodoPago, setMetodoPago] =
    useState('EFECTIVO')

  const [errores, setErrores] =
    useState({})

  const [cargandoServicio, setCargandoServicio] =
    useState(true)

  const [errorCargaServicio, setErrorCargaServicio] =
    useState('')

  const [observacionAdmin, setObservacionAdmin] =
    useState('')

  const [servicioIdActual, setServicioIdActual] =
    useState(null)


  // ==========================================
  // HERRAMIENTAS
  // ==========================================

  const [herramientas, setHerramientas] =
    useState([])

  const [
    herramientasSeleccionadas,
    setHerramientasSeleccionadas
  ] = useState([])

  const [
    cargandoHerramientas,
    setCargandoHerramientas
  ] = useState(true)

  const [
    errorHerramientas,
    setErrorHerramientas
  ] = useState('')


  // ==========================================
  // EVIDENCIAS
  // ==========================================

  const [evidencias, setEvidencias] =
    useState({
      antes: [],
      durante: [],
      despues: []
    })

  const [
    mensajeEvidencias,
    setMensajeEvidencias
  ] = useState('')


  // ==========================================
  // CIERRE DEL SERVICIO
  // ==========================================

  const [
    cerrandoServicio,
    setCerrandoServicio
  ] = useState(false)

  const [
    mensajeCierre,
    setMensajeCierre
  ] = useState('')


  // ==========================================
  // CARGAR HERRAMIENTAS
  // ==========================================

  useEffect(() => {
    cargarPantallaServicio()

    return () => {
      setEvidencias((actuales) => {
        ;[
          ...actuales.antes,
          ...actuales.durante,
          ...actuales.despues
        ].forEach((item) => {
          if (item.preview?.startsWith('blob:')) {
            URL.revokeObjectURL(item.preview)
          }
        })

        return actuales
      })
    }
  }, [cita?.id])


  async function cargarPantallaServicio() {
    setCargandoServicio(true)
    setErrorCargaServicio('')

    try {
      await Promise.all([
        cargarHerramientas(),
        cargarServicioExistente()
      ])
    } catch (error) {
      console.error('Error cargando servicio existente:', error)
      setErrorCargaServicio(
        error?.message ||
        'No fue posible recuperar la información del servicio.'
      )
    } finally {
      setCargandoServicio(false)
    }
  }


  async function cargarServicioExistente() {
    if (!cita?.id) {
      throw new Error('No se recibió una cita válida.')
    }

    const { data: servicio, error: servicioError } =
      await supabase
        .from('servicios')
        .select(`
          id,
          folio,
          cita_id,
          estado,
          diagnostico,
          trabajo_realizado,
          recomendaciones,
          observacion_admin
        `)
        .eq('cita_id', cita.id)
        .single()

    if (servicioError) {
      throw new Error(
        'No fue posible recuperar el servicio: ' +
        servicioError.message
      )
    }

    setServicioIdActual(servicio.id)
    setDiagnostico(servicio.diagnostico || '')
    setTrabajoRealizado(servicio.trabajo_realizado || '')
    setObservaciones(servicio.recomendaciones || '')
    setObservacionAdmin(servicio.observacion_admin || '')

    const [
      herramientasResultado,
      pagoResultado,
      evidenciasResultado
    ] = await Promise.all([
      supabase
        .from('servicios_herramientas')
        .select('herramienta_id')
        .eq('servicio_id', servicio.id),

      supabase
        .from('pagos')
        .select(`
          id,
          servicio_id,
          metodo_pago_id,
          importe,
          estatus,
          metodos_pago (
            id,
            nombre
          )
        `)
        .eq('servicio_id', servicio.id)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle(),

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
        .eq('servicio_id', servicio.id)
        .order('id', { ascending: true })
    ])

    if (herramientasResultado.error) {
      throw new Error(
        'No fue posible recuperar las herramientas: ' +
        herramientasResultado.error.message
      )
    }

    if (pagoResultado.error) {
      throw new Error(
        'No fue posible recuperar el pago: ' +
        pagoResultado.error.message
      )
    }

    if (evidenciasResultado.error) {
      throw new Error(
        'No fue posible recuperar las fotografías: ' +
        evidenciasResultado.error.message
      )
    }

    setHerramientasSeleccionadas(
      (herramientasResultado.data || []).map(
        (item) => item.herramienta_id
      )
    )

    if (pagoResultado.data) {
      setImporteFinal(
        String(pagoResultado.data.importe ?? '')
      )

      const mapaMetodoPorId = {
        1: 'EFECTIVO',
        2: 'TRANSFERENCIA',
        3: 'TARJETA_CREDITO',
        4: 'TARJETA_DEBITO'
      }

      setMetodoPago(
        mapaMetodoPorId[pagoResultado.data.metodo_pago_id] ||
        'EFECTIVO'
      )
    }

    const evidenciasCargadas =
      await cargarEvidenciasExistentes(
        evidenciasResultado.data || []
      )

    setEvidencias(evidenciasCargadas)
  }


  async function cargarEvidenciasExistentes(registros) {
    const agrupadas = {
      antes: [],
      durante: [],
      despues: []
    }

    if (registros.length === 0) {
      return agrupadas
    }

    const token = await obtenerToken()

    for (const registro of registros) {
      const tipo = String(registro.tipo || '').toLowerCase()

      if (!agrupadas[tipo]) {
        continue
      }

      let preview = ''

      try {
        const respuesta = await fetch(
          registro.archivo_url,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (respuesta.ok) {
          const blob = await respuesta.blob()
          preview = URL.createObjectURL(blob)
        }
      } catch (error) {
        console.error(
          'No fue posible cargar una fotografía existente:',
          error
        )
      }

      let key = null

      try {
        const url = new URL(registro.archivo_url)
        key = url.searchParams.get('key')
      } catch {
        key = null
      }

      agrupadas[tipo].push({
        id: `db-${registro.id}`,
        evidenciaDbId: registro.id,
        file: null,
        preview,
        nombreOriginal: registro.descripcion || 'Evidencia guardada',
        originalSize: 0,
        compressedSize: 0,
        estado: 'subida',
        key,
        archivoUrl: registro.archivo_url,
        existente: true,
        error: preview ? '' : 'No fue posible mostrar la vista previa.'
      })
    }

    return agrupadas
  }


  async function cargarHerramientas() {

    setCargandoHerramientas(true)
    setErrorHerramientas('')

    const { data, error } =
      await supabase
        .from('herramientas')
        .select(`
          id,
          nombre,
          descripcion,
          activo
        `)
        .eq(
          'activo',
          true
        )
        .order(
          'nombre',
          {
            ascending: true
          }
        )

    if (error) {

      console.error(
        'Error cargando herramientas:',
        error
      )

      setErrorHerramientas(
        'No fue posible cargar las herramientas.'
      )

      setHerramientas([])
      setCargandoHerramientas(false)

      return
    }

    setHerramientas(
      data || []
    )

    setCargandoHerramientas(false)
  }


  // ==========================================
  // SELECCIONAR HERRAMIENTA
  // ==========================================

  function cambiarHerramienta(id) {

    setHerramientasSeleccionadas(
      (seleccionadas) => {

        if (
          seleccionadas.includes(id)
        ) {

          return seleccionadas.filter(
            (herramientaId) =>
              herramientaId !== id
          )
        }

        return [
          ...seleccionadas,
          id
        ]
      }
    )

    limpiarError(
      'herramientas'
    )
  }


  // ==========================================
  // LIMPIAR ERROR
  // ==========================================

  function limpiarError(campo) {

    setErrores(
      (anteriores) => ({
        ...anteriores,
        [campo]: ''
      })
    )
  }


  // ==========================================
  // OBTENER SESION
  // ==========================================

  async function obtenerToken() {

    const {
      data,
      error
    } =
      await supabase.auth.getSession()

    if (error) {

      console.error(
        'Error obteniendo sesión:',
        error
      )

      throw new Error(
        'No fue posible obtener la sesión.'
      )
    }

    const token =
      data?.session?.access_token

    if (!token) {

      throw new Error(
        'La sesión expiró. Vuelve a iniciar sesión.'
      )
    }

    return token
  }


  // ==========================================
  // CARGAR IMAGEN EN NAVEGADOR
  // ==========================================

  function cargarImagen(file) {

    return new Promise(
      (resolve, reject) => {

        const reader =
          new FileReader()

        reader.onload = () => {

          const imagen =
            new Image()

          imagen.onload = () =>
            resolve(imagen)

          imagen.onerror = () =>
            reject(
              new Error(
                'No fue posible leer la fotografía.'
              )
            )

          imagen.src =
            reader.result
        }

        reader.onerror = () =>
          reject(
            new Error(
              'No fue posible abrir la fotografía.'
            )
          )

        reader.readAsDataURL(
          file
        )
      }
    )
  }


  // ==========================================
  // COMPRIMIR FOTOGRAFIA
  // ==========================================

  async function comprimirImagen(file) {

    const imagen =
      await cargarImagen(file)

    const MAX_DIMENSION =
      1600

    let ancho =
      imagen.width

    let alto =
      imagen.height


    if (
      ancho > MAX_DIMENSION ||
      alto > MAX_DIMENSION
    ) {

      const escala =
        Math.min(
          MAX_DIMENSION / ancho,
          MAX_DIMENSION / alto
        )

      ancho =
        Math.round(
          ancho * escala
        )

      alto =
        Math.round(
          alto * escala
        )
    }


    const canvas =
      document.createElement(
        'canvas'
      )

    canvas.width =
      ancho

    canvas.height =
      alto


    const contexto =
      canvas.getContext(
        '2d'
      )


    contexto.drawImage(
      imagen,
      0,
      0,
      ancho,
      alto
    )


    const blob =
      await new Promise(
        (resolve) => {

          canvas.toBlob(
            resolve,
            'image/webp',
            0.78
          )
        }
      )


    if (!blob) {

      throw new Error(
        'No fue posible comprimir la fotografía.'
      )
    }


    const nombreBase =
      file.name
        ?.replace(
          /\.[^/.]+$/,
          ''
        )
        || 'evidencia'


    return new File(
      [
        blob
      ],
      `${nombreBase}.webp`,
      {
        type:
          'image/webp',

        lastModified:
          Date.now()
      }
    )
  }


  // ==========================================
  // ACTUALIZAR UNA EVIDENCIA
  // ==========================================

  function actualizarEvidencia(
    tipo,
    id,
    cambios
  ) {

    setEvidencias(
      (actuales) => ({

        ...actuales,

        [tipo]:
          actuales[tipo].map(
            (item) => {

              if (
                item.id === id
              ) {

                return {
                  ...item,
                  ...cambios
                }
              }

              return item
            }
          )
      })
    )
  }
    // ==========================================
  // SUBIR A R2
  // ==========================================

  async function subirAR2(
    tipo,
    evidencia
  ) {

    try {

      actualizarEvidencia(
        tipo,
        evidencia.id,
        {
          estado:
            'subiendo',

          error:
            ''
        }
      )


      if (!EVIDENCIAS_API) {

        throw new Error(
          'No está configurada VITE_EVIDENCIAS_API.'
        )
      }


      const token =
        await obtenerToken()


      const formData =
        new FormData()


      formData.append(
        'file',
        evidencia.file
      )


      formData.append(
        'citaId',
        String(
          cita?.id
        )
      )


      formData.append(
        'tipo',
        tipo
      )


      const respuesta =
        await fetch(
          `${EVIDENCIAS_API}/upload`,
          {
            method:
              'POST',

            headers: {
              Authorization:
                `Bearer ${token}`
            },

            body:
              formData
          }
        )


      let resultado

      try {

        resultado =
          await respuesta.json()

      } catch {

        resultado =
          null
      }


      if (
        !respuesta.ok ||
        !resultado?.ok
      ) {

        throw new Error(
          resultado?.error ||
          `Error HTTP ${respuesta.status}`
        )
      }


      actualizarEvidencia(
        tipo,
        evidencia.id,
        {
          estado:
            'subida',

          key:
            resultado.evidencia?.key,

          sizeR2:
            resultado.evidencia?.size,

          error:
            ''
        }
      )


      setMensajeEvidencias(
        '✓ Evidencia guardada correctamente en Cloudflare R2.'
      )


    } catch (error) {

      console.error(
        'Error subiendo evidencia:',
        error
      )


      actualizarEvidencia(
        tipo,
        evidencia.id,
        {
          estado:
            'error',

          error:
            error.message
        }
      )


      setMensajeEvidencias(
        `No fue posible subir una fotografía: ${error.message}`
      )
    }
  }


  // ==========================================
  // SELECCIONAR FOTOS
  // ==========================================

  async function seleccionarFotos(
    tipo,
    evento
  ) {

    const archivos =
      Array.from(
        evento.target.files || []
      )


    evento.target.value =
      ''


    if (
      archivos.length === 0
    ) {
      return
    }


    setMensajeEvidencias('')


    for (
      const archivoOriginal
      of archivos
    ) {

      try {

        if (
          !archivoOriginal.type
            .startsWith(
              'image/'
            )
        ) {

          throw new Error(
            'El archivo seleccionado no es una imagen.'
          )
        }


        const archivoComprimido =
          await comprimirImagen(
            archivoOriginal
          )


        const preview =
          URL.createObjectURL(
            archivoComprimido
          )


        const evidencia = {

          id:
            crypto.randomUUID(),

          file:
            archivoComprimido,

          preview,

          nombreOriginal:
            archivoOriginal.name,

          originalSize:
            archivoOriginal.size,

          compressedSize:
            archivoComprimido.size,

          estado:
            'preparada',

          key:
            null,

          error:
            ''
        }


        setEvidencias(
          (actuales) => ({

            ...actuales,

            [tipo]: [
              ...actuales[tipo],
              evidencia
            ]
          })
        )


        await subirAR2(
          tipo,
          evidencia
        )


      } catch (error) {

        console.error(
          error
        )


        setMensajeEvidencias(
          error.message
        )
      }
    }
  }


  // ==========================================
  // ELIMINAR EVIDENCIA DE R2
  // ==========================================

  async function eliminarEvidencia(
    tipo,
    evidencia
  ) {

    const confirmar =
      window.confirm(
        '¿Deseas eliminar esta fotografía?'
      )


    if (!confirmar) {
      return
    }


    try {

      if (
        evidencia.estado ===
          'subida' &&
        evidencia.key
      ) {

        const token =
          await obtenerToken()


        const respuesta =
          await fetch(
            `${EVIDENCIAS_API}/evidencia?key=${encodeURIComponent(
              evidencia.key
            )}`,
            {
              method:
                'DELETE',

              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          )


        const resultado =
          await respuesta.json()


        if (
          !respuesta.ok ||
          !resultado?.ok
        ) {

          throw new Error(
            resultado?.error ||
            'No fue posible eliminar la fotografía de R2.'
          )
        }
      }


      if (
        evidencia.existente &&
        evidencia.evidenciaDbId
      ) {
        const { error: evidenciaDbError } =
          await supabase
            .from('evidencias')
            .delete()
            .eq('id', evidencia.evidenciaDbId)

        if (evidenciaDbError) {
          throw new Error(
            'No fue posible eliminar el registro de la fotografía: ' +
            evidenciaDbError.message
          )
        }
      }


      if (
        evidencia.preview
      ) {

        URL.revokeObjectURL(
          evidencia.preview
        )
      }


      setEvidencias(
        (actuales) => ({

          ...actuales,

          [tipo]:
            actuales[tipo].filter(
              (item) =>
                item.id !==
                evidencia.id
            )

        })
      )


      setMensajeEvidencias(
        'Fotografía eliminada correctamente.'
      )


    } catch (error) {

      console.error(
        error
      )


      window.alert(
        error.message
      )
    }
  }


  // ==========================================
  // REINTENTAR
  // ==========================================

  async function reintentarEvidencia(
    tipo,
    evidencia
  ) {

    await subirAR2(
      tipo,
      evidencia
    )
  }


  // ==========================================
  // FORMATEAR BYTES
  // ==========================================

  function formatearBytes(
    bytes
  ) {

    if (
      !bytes &&
      bytes !== 0
    ) {
      return ''
    }


    if (
      bytes < 1024
    ) {

      return `${bytes} B`
    }


    if (
      bytes <
      1024 * 1024
    ) {

      return `${
        (
          bytes / 1024
        ).toFixed(0)
      } KB`
    }


    return `${
      (
        bytes /
        1024 /
        1024
      ).toFixed(2)
    } MB`
  }


  // ==========================================
  // VALIDAR
  // ==========================================

  function validar() {

    const nuevosErrores =
      {}


    if (
      !diagnostico.trim()
    ) {

      nuevosErrores.diagnostico =
        'Captura el diagnóstico del servicio.'
    }


    if (
      !trabajoRealizado.trim()
    ) {

      nuevosErrores.trabajo =
        'Captura el trabajo realizado.'
    }


    if (
      herramientasSeleccionadas
        .length === 0
    ) {

      nuevosErrores.herramientas =
        'Selecciona al menos una herramienta utilizada.'
    }


    if (
      !importeFinal ||
      Number(importeFinal) <= 0
    ) {

      nuevosErrores.importe =
        'Captura un importe final mayor a 0.'
    }


    if (
      !metodoPago
    ) {

      nuevosErrores.metodoPago =
        'Selecciona el método de pago.'
    }


    const existeCarga =
      [
        ...evidencias.antes,
        ...evidencias.durante,
        ...evidencias.despues
      ].some(
        (item) =>
          item.estado ===
          'subiendo'
      )


    if (
      existeCarga
    ) {

      nuevosErrores.evidencias =
        'Espera a que terminen de subir las fotografías.'
    }


    const existeErrorEvidencia =
      [
        ...evidencias.antes,
        ...evidencias.durante,
        ...evidencias.despues
      ].some(
        (item) =>
          item.estado ===
          'error'
      )


    if (
      existeErrorEvidencia
    ) {

      nuevosErrores.evidencias =
        'Existe una fotografía con error. Reinténtala o elimínala antes de concluir.'
    }


    setErrores(
      nuevosErrores
    )


    return (
      Object.keys(
        nuevosErrores
      ).length === 0
    )
  }
    // ==========================================
  // CONCLUIR SERVICIO
  // ==========================================

  async function continuarFinalizacion() {

    if (
      !validar()
    ) {
      return
    }


    const confirmar =
      window.confirm(
        '¿Deseas concluir el servicio? Se guardarán el diagnóstico, trabajo realizado, herramientas, pago y el servicio quedará como CONCLUIDO.'
      )


    if (
      !confirmar
    ) {
      return
    }


    setCerrandoServicio(true)
    setMensajeCierre('')


    try {

      // ==========================================
      // 1. OBTENER USUARIO ACTUAL
      // ==========================================

      const {
        data: usuarioData,
        error: usuarioError
      } =
        await supabase.auth.getUser()


      if (
        usuarioError
      ) {

        throw usuarioError
      }


      const usuarioId =
        usuarioData?.user?.id


      if (
        !usuarioId
      ) {

        throw new Error(
          'No fue posible identificar al usuario conectado.'
        )
      }


      // ==========================================
      // 2. LOCALIZAR SERVICIO DE LA CITA
      // ==========================================

      const {
        data: servicioActual,
        error: servicioError
      } =
        await supabase
          .from('servicios')
          .select(`
            id,
            folio,
            cita_id,
            estado
          `)
          .eq(
            'cita_id',
            cita?.id
          )
          .single()


      if (
        servicioError
      ) {

        throw new Error(
          'No fue posible localizar el servicio: ' +
          servicioError.message
        )
      }


      if (
        !servicioActual
      ) {

        throw new Error(
          'No existe un servicio asociado a esta cita.'
        )
      }


      if (
        servicioActual.estado ===
        'CONCLUIDO'
      ) {

        throw new Error(
          'Este servicio ya se encuentra concluido.'
        )
      }


      const servicioId =
        servicioActual.id


      // ==========================================
      // 3. CONSULTAR HERRAMIENTAS YA GUARDADAS
      // ==========================================

      const {
        data: herramientasGuardadas,
        error: herramientasConsultaError
      } =
        await supabase
          .from(
            'servicios_herramientas'
          )
          .select(
            'herramienta_id'
          )
          .eq(
            'servicio_id',
            servicioId
          )


      if (
        herramientasConsultaError
      ) {

        throw new Error(
          'No fue posible consultar las herramientas del servicio: ' +
          herramientasConsultaError.message
        )
      }


      const idsGuardados =
        new Set(
          (
            herramientasGuardadas ||
            []
          ).map(
            (item) =>
              Number(
                item.herramienta_id
              )
          )
        )


      // ==========================================
      // 4. PREPARAR HERRAMIENTAS NUEVAS
      // ==========================================

      const herramientasNuevas =
        herramientasSeleccionadas
          .filter(
            (herramientaId) =>
              !idsGuardados.has(
                Number(
                  herramientaId
                )
              )
          )
          .map(
            (herramientaId) => ({
              servicio_id:
                servicioId,

              herramienta_id:
                herramientaId,

              observaciones:
                null
            })
          )


      // ==========================================
      // 5. GUARDAR HERRAMIENTAS
      // ==========================================

      if (
        herramientasNuevas.length > 0
      ) {

        const {
          error: herramientasInsertError
        } =
          await supabase
            .from(
              'servicios_herramientas'
            )
            .insert(
              herramientasNuevas
            )


        if (
          herramientasInsertError
        ) {

          throw new Error(
            'No fue posible guardar las herramientas utilizadas: ' +
            herramientasInsertError.message
          )
        }
      }


      // ==========================================
      // 6. MAPA DE METODOS DE PAGO
      // ==========================================

      const mapaMetodosPago = {

        EFECTIVO:
          1,

        TRANSFERENCIA:
          2,

        TARJETA_CREDITO:
          3,

        TARJETA_DEBITO:
          4
      }


      const metodoPagoId =
        mapaMetodosPago[
          metodoPago
        ]


      if (
        !metodoPagoId
      ) {

        throw new Error(
          'El método de pago seleccionado no es válido.'
        )
      }


      // ==========================================
      // 7. VERIFICAR SI YA EXISTE PAGO
      // ==========================================

      const {
        data: pagoExistente,
        error: pagoConsultaError
      } =
        await supabase
          .from('pagos')
          .select(`
            id,
            servicio_id
          `)
          .eq(
            'servicio_id',
            servicioId
          )
          .maybeSingle()


      if (
        pagoConsultaError
      ) {

        throw new Error(
          'No fue posible verificar el pago del servicio: ' +
          pagoConsultaError.message
        )
      }


      // ==========================================
      // 8. REGISTRAR PAGO
      // ==========================================

      if (
        !pagoExistente
      ) {

        const {
          error: pagoError
        } =
          await supabase
            .from('pagos')
            .insert({
              servicio_id:
                servicioId,

              metodo_pago_id:
                metodoPagoId,

              importe:
                Number(
                  importeFinal
                ),

              estatus:
                'PAGADO',

              referencia:
                null,

              registrado_por:
                usuarioId
            })


        if (
          pagoError
        ) {

          throw new Error(
            'No fue posible registrar el pago: ' +
            pagoError.message
          )
        }

      } else {

        const {
          error: pagoUpdateError
        } =
          await supabase
            .from('pagos')
            .update({
              metodo_pago_id:
                metodoPagoId,

              importe:
                Number(importeFinal),

              estatus:
                'PAGADO'
            })
            .eq(
              'id',
              pagoExistente.id
            )

        if (pagoUpdateError) {
          throw new Error(
            'No fue posible actualizar el pago: ' +
            pagoUpdateError.message
          )
        }
      }


      // ==========================================
      // 9. ACTUALIZAR SERVICIO
      // ==========================================

      const {
        error: servicioUpdateError
      } =
        await supabase
          .from('servicios')
          .update({

            diagnostico:
              diagnostico.trim(),

            trabajo_realizado:
              trabajoRealizado.trim(),

            recomendaciones:
              observaciones.trim() ||
              null,

            estado:
              'CONCLUIDO'
          })
          .eq(
            'id',
            servicioId
          )


      if (
        servicioUpdateError
      ) {

        throw new Error(
          'No fue posible concluir el servicio: ' +
          servicioUpdateError.message
        )
      }


      // ==========================================
      // 10. ACTUALIZAR CITA
      // ==========================================

      const {
        error: citaError
      } =
        await supabase
          .from('citas')
          .update({
            estado:
              'CONCLUIDO'
          })
          .eq(
            'id',
            cita?.id
          )


      if (
        citaError
      ) {

        throw new Error(
          'El servicio fue actualizado, pero no fue posible concluir la cita: ' +
          citaError.message
        )
      }


      // ==========================================
      // 11. MENSAJE DE EXITO
      // ==========================================

      setMensajeCierre(
        `✓ Servicio ${servicioActual.folio} concluido correctamente.`
      )


      window.alert(
        `Servicio ${servicioActual.folio} concluido correctamente.`
      )


      onVolver()


    } catch (
      error
    ) {

      console.error(
        'Error concluyendo servicio:',
        error
      )


      const mensaje =
        error?.message ||
        'No fue posible concluir el servicio.'


      setMensajeCierre(
        `⚠️ ${mensaje}`
      )


      window.alert(
        mensaje
      )


    } finally {

      setCerrandoServicio(
        false
      )
    }
  }
    // ==========================================
  // COMPONENTE GRUPO DE FOTOS
  // ==========================================

  function GrupoEvidencias({
    tipo,
    titulo
  }) {

    const fotos =
      evidencias[tipo]


    return (

      <div className="es-evidence-group">

        <div className="es-evidence-heading">

          <div>

            <strong>
              {titulo}
            </strong>

            <small>
              {fotos.length}{' '}

              {
                fotos.length === 1
                  ? 'fotografía'
                  : 'fotografías'
              }
            </small>

          </div>


          <label className="es-add-photo">

            + Agregar

            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) =>
                seleccionarFotos(
                  tipo,
                  e
                )
              }
            />

          </label>

        </div>


        {
          fotos.length === 0
            ? (

              <label className="es-photo-box">

                <span>
                  📷
                </span>

                <strong>
                  {titulo}
                </strong>

                <small>
                  Cámara o galería
                </small>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={(e) =>
                    seleccionarFotos(
                      tipo,
                      e
                    )
                  }
                />

              </label>

            )
            : (

              <div className="es-preview-grid">

                {
                  fotos.map(
                    (foto) => (

                      <div
                        className="es-preview-card"
                        key={foto.id}
                      >

                        <img
                          src={
                            foto.preview
                          }
                          alt={
                            `Evidencia ${titulo}`
                          }
                        />


                        <div className="es-preview-body">

                          <div
                            className={
                              `es-upload-status ${foto.estado}`
                            }
                          >

                            {
                              foto.estado ===
                                'subiendo' &&
                              '⏳ Subiendo...'
                            }

                            {
                              foto.estado ===
                                'subida' &&
                              '✓ Guardada en R2'
                            }

                            {
                              foto.estado ===
                                'error' &&
                              '⚠ Error'
                            }

                            {
                              foto.estado ===
                                'preparada' &&
                              'Preparando...'
                            }

                          </div>


                          <small>

                            {
                              formatearBytes(
                                foto.compressedSize
                              )
                            }

                          </small>


                          {
                            foto.originalSize >
                              foto.compressedSize && (

                              <small className="es-compression">

                                Original:{' '}

                                {
                                  formatearBytes(
                                    foto.originalSize
                                  )
                                }

                              </small>

                            )
                          }


                          {
                            foto.error && (

                              <div className="es-photo-error">

                                {foto.error}

                              </div>

                            )
                          }


                          <div className="es-photo-actions">

                            {
                              foto.estado ===
                                'error' && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    reintentarEvidencia(
                                      tipo,
                                      foto
                                    )
                                  }
                                >
                                  Reintentar
                                </button>

                              )
                            }


                            <button
                              type="button"
                              disabled={
                                foto.estado ===
                                'subiendo'
                              }
                              onClick={() =>
                                eliminarEvidencia(
                                  tipo,
                                  foto
                                )
                              }
                            >
                              Eliminar
                            </button>

                          </div>

                        </div>

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


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (

    <div className="es-page">

      <header className="es-header">

        <div>

          <button
            type="button"
            className="es-back"
            onClick={
              onVolver
            }
          >
            ← Mis servicios
          </button>


          <span className="es-eyebrow">
            SERVICIO EN PROCESO
          </span>


          <h1>
            Ejecución del servicio
          </h1>


          <p>
            Cita #{cita?.id}
          </p>

        </div>


        <div className="es-status">
          EN PROCESO
        </div>

      </header>


      <main className="es-content">


        {cargandoServicio && (
          <div className="es-info">
            Recuperando información guardada del servicio...
          </div>
        )}


        {errorCargaServicio && (
          <div className="es-error">
            {errorCargaServicio}
          </div>
        )}


        {observacionAdmin && (
          <section
            className="es-card"
            style={{
              border: '1px solid #F5C2C7',
              background: '#FFF8F8'
            }}
          >
            <div className="es-card-title">
              <div>
                <span>DEVUELTO POR ADMINISTRACIÓN</span>
                <h2>Corrección solicitada</h2>
              </div>
              <div className="es-icon">↩</div>
            </div>

            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {observacionAdmin}
            </p>
          </section>
        )}


        {/* RESUMEN */}

        <section className="es-summary">

          <div>

            <small>
              CLIENTE
            </small>

            <strong>
              {cita?.clientes?.nombre}
            </strong>

          </div>


          <div>

            <small>
              SERVICIO
            </small>

            <strong>
              {cita?.tipos_servicio?.nombre}
            </strong>

          </div>


          <div className="es-summary-full">

            <small>
              PROBLEMA REPORTADO
            </small>

            <strong>
              {cita?.descripcion_problema}
            </strong>

          </div>

        </section>


        {/* DIAGNOSTICO */}

        <section className="es-card">

          <div className="es-card-title">

            <div>

              <span>
                DIAGNÓSTICO
              </span>

              <h2>
                ¿Qué encontraste?
              </h2>

            </div>


            <div className="es-icon">
              🔎
            </div>

          </div>


          <div className="es-field">

            <label>
              Diagnóstico *
            </label>


            <textarea
              rows="5"
              value={
                diagnostico
              }
              className={
                errores.diagnostico
                  ? 'es-input-error'
                  : ''
              }
              onChange={(e) => {

                setDiagnostico(
                  e.target.value
                )

                limpiarError(
                  'diagnostico'
                )

              }}
              placeholder="Describe la causa encontrada..."
            />


            {
              errores.diagnostico && (

                <span className="es-error">
                  {errores.diagnostico}
                </span>

              )
            }

          </div>

        </section>


        {/* TRABAJO */}

        <section className="es-card">

          <div className="es-card-title">

            <div>

              <span>
                TRABAJO REALIZADO
              </span>

              <h2>
                ¿Qué se hizo?
              </h2>

            </div>


            <div className="es-icon">
              🔧
            </div>

          </div>


          <div className="es-field">

            <label>
              Trabajo realizado *
            </label>


            <textarea
              rows="6"
              value={
                trabajoRealizado
              }
              className={
                errores.trabajo
                  ? 'es-input-error'
                  : ''
              }
              onChange={(e) => {

                setTrabajoRealizado(
                  e.target.value
                )

                limpiarError(
                  'trabajo'
                )

              }}
              placeholder="Describe el procedimiento realizado..."
            />


            {
              errores.trabajo && (

                <span className="es-error">
                  {errores.trabajo}
                </span>

              )
            }

          </div>

        </section>
                {/* HERRAMIENTAS */}

        <section className="es-card">

          <div className="es-card-title">

            <div>

              <span>
                EQUIPO DE TRABAJO
              </span>

              <h2>
                Herramientas utilizadas
              </h2>

            </div>


            <div className="es-icon">
              🧰
            </div>

          </div>


          <div className="es-field">

            <label>
              Selecciona una o varias herramientas *
            </label>


            {
              cargandoHerramientas && (

                <div className="es-info">
                  Cargando herramientas...
                </div>

              )
            }


            {
              errorHerramientas && (

                <div className="es-error">
                  {errorHerramientas}
                </div>

              )
            }


            {
              !cargandoHerramientas &&
              !errorHerramientas && (

                <div className="es-tools-grid">

                  {
                    herramientas.map(
                      (herramienta) => {

                        const seleccionada =
                          herramientasSeleccionadas
                            .includes(
                              herramienta.id
                            )


                        return (

                          <button
                            key={
                              herramienta.id
                            }
                            type="button"
                            className={
                              seleccionada
                                ? 'es-tool-option selected'
                                : 'es-tool-option'
                            }
                            onClick={() =>
                              cambiarHerramienta(
                                herramienta.id
                              )
                            }
                          >

                            <span className="es-tool-check">

                              {
                                seleccionada
                                  ? '✓'
                                  : '+'
                              }

                            </span>


                            <div>

                              <strong>
                                {herramienta.nombre}
                              </strong>


                              {
                                herramienta.descripcion && (

                                  <small>
                                    {herramienta.descripcion}
                                  </small>

                                )
                              }

                            </div>

                          </button>

                        )
                      }
                    )
                  }

                </div>

              )
            }


            {
              errores.herramientas && (

                <span className="es-error">
                  {errores.herramientas}
                </span>

              )
            }


            {
              herramientasSeleccionadas
                .length > 0 && (

                <div className="es-tools-counter">

                  {
                    herramientasSeleccionadas
                      .length
                  }

                  {' '}

                  {
                    herramientasSeleccionadas
                      .length === 1
                      ? 'herramienta seleccionada'
                      : 'herramientas seleccionadas'
                  }

                </div>

              )
            }

          </div>

        </section>


        {/* EVIDENCIAS */}

        <section className="es-card">

          <div className="es-card-title">

            <div>

              <span>
                EVIDENCIAS
              </span>

              <h2>
                Fotografías del servicio
              </h2>

            </div>


            <div className="es-icon">
              📷
            </div>

          </div>


          <div className="es-evidence-layout">

            <GrupoEvidencias
              tipo="antes"
              titulo="Antes"
            />

            <GrupoEvidencias
              tipo="durante"
              titulo="Durante"
            />

            <GrupoEvidencias
              tipo="despues"
              titulo="Después"
            />

          </div>


          {
            mensajeEvidencias && (

              <div className="es-info">
                {mensajeEvidencias}
              </div>

            )
          }


          {
            errores.evidencias && (

              <span className="es-error">
                {errores.evidencias}
              </span>

            )
          }


          <div className="es-info">

            Las fotografías se reducen automáticamente
            y se almacenan en el bucket privado de
            Cloudflare R2.

          </div>

        </section>


        {/* COBRO */}

        <section className="es-card">

          <div className="es-card-title">

            <div>

              <span>
                COBRO
              </span>

              <h2>
                Importe del servicio
              </h2>

            </div>


            <div className="es-icon">
              $
            </div>

          </div>


          <div className="es-grid two">

            <div className="es-field">

              <label>
                Importe final *
              </label>


              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  importeFinal
                }
                className={
                  errores.importe
                    ? 'es-input-error'
                    : ''
                }
                onChange={(e) => {

                  setImporteFinal(
                    e.target.value
                  )

                  limpiarError(
                    'importe'
                  )

                }}
                placeholder="0.00"
              />


              {
                errores.importe && (

                  <span className="es-error">
                    {errores.importe}
                  </span>

                )
              }

            </div>


            <div className="es-field">

              <label>
                Método de pago *
              </label>


              <select
                value={
                  metodoPago
                }
                className={
                  errores.metodoPago
                    ? 'es-input-error'
                    : ''
                }
                onChange={(e) => {

                  setMetodoPago(
                    e.target.value
                  )

                  limpiarError(
                    'metodoPago'
                  )

                }}
              >

                <option value="EFECTIVO">
                  Efectivo
                </option>

                <option value="TRANSFERENCIA">
                  Transferencia
                </option>

                <option value="TARJETA_CREDITO">
                  Tarjeta de crédito
                </option>

                <option value="TARJETA_DEBITO">
                  Tarjeta de débito
                </option>

              </select>


              {
                errores.metodoPago && (

                  <span className="es-error">
                    {errores.metodoPago}
                  </span>

                )
              }

            </div>

          </div>

        </section>


        {/* OBSERVACIONES */}

        <section className="es-card">

          <div className="es-field">

            <label>
              Observaciones finales
            </label>


            <textarea
              rows="4"
              value={
                observaciones
              }
              onChange={(e) =>
                setObservaciones(
                  e.target.value
                )
              }
              placeholder="Recomendaciones, trabajos futuros, comentarios para el cliente..."
            />

          </div>

        </section>
                {/* MENSAJE DE CIERRE */}

        {
          mensajeCierre && (

            <div className="es-info">

              {mensajeCierre}

            </div>

          )
        }


        {/* BOTONES */}

        <section className="es-actions">

          <button
            type="button"
            className="es-secondary"
            onClick={
              onVolver
            }
            disabled={
              cerrandoServicio
            }
          >
            ← Volver
          </button>


          <button
            type="button"
            className="es-primary"
            onClick={
              continuarFinalizacion
            }
            disabled={
              cerrandoServicio ||
              cargandoServicio ||
              Boolean(errorCargaServicio)
            }
          >

            {
              cerrandoServicio
                ? 'CONCLUYENDO SERVICIO...'
                : 'Concluir servicio →'
            }

          </button>

        </section>

      </main>

    </div>

  )
}


export default EjecucionServicio
        
  