import {
  useEffect,
  useState
} from 'react'

import { supabase } from '../supabase'

import {
  generarReporteServicio
} from '../utils/generarReporteServicio'

import './EnviarReporteCliente.css'


const MENSAJE_AGRADECIMIENTO =
  'Gracias por confiar en DESTAPA YA. Te compartimos el reporte de tu servicio. ¡Estamos para servirte!'


function EnviarReporteCliente({
  cita,
  perfil
}) {

  const [
    servicio,
    setServicio
  ] = useState(null)

  const [
    cargando,
    setCargando
  ] = useState(true)

  const [
    compartiendo,
    setCompartiendo
  ] = useState(false)

  const [
    mensaje,
    setMensaje
  ] = useState('')


  useEffect(() => {

    if (!cita?.id) {
      return
    }


    cargarServicio()


    const intervalo =
      window.setInterval(
        () => {
          cargarServicio(
            true
          )
        },
        20000
      )


    return () => {
      window.clearInterval(
        intervalo
      )
    }

  }, [cita?.id])


  // ==========================================
  // CARGAR SERVICIO / ESTADO ADMIN
  // ==========================================

  async function cargarServicio(
    silencioso = false
  ) {

    if (!cita?.id) {
      return
    }


    if (!silencioso) {
      setCargando(true)
    }


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
            reporte_enviado_cliente,
            fecha_reporte_enviado,
            reporte_enviado_por,

            servicios_tecnicos (
              id,
              tecnico_id,

              perfiles (
                id,
                nombre
              )
            )
          `)
          .eq(
            'cita_id',
            cita.id
          )
          .order(
            'id',
            {
              ascending:
                false
            }
          )
          .limit(1)
          .maybeSingle()


      if (error) {
        throw error
      }


      setServicio(
        data || null
      )


    } catch (error) {

      console.error(
        'Error consultando aprobación administrativa:',
        error
      )


      if (!silencioso) {

        setMensaje(
          'No fue posible verificar la confirmación administrativa: ' +
          error.message
        )
      }

    } finally {

      if (!silencioso) {
        setCargando(false)
      }
    }
  }


  // ==========================================
  // IMAGENES PRIVADAS
  // ==========================================

  async function cargarImagenesPrivadas(
    registros
  ) {

    if (
      !registros ||
      registros.length === 0
    ) {
      return []
    }


    const {
      data
    } =
      await supabase.auth
        .getSession()


    const token =
      data
        ?.session
        ?.access_token


    if (!token) {

      return registros.map(
        item => ({
          ...item,
          preview_url:
            null
        })
      )
    }


    return await Promise.all(

      registros.map(
        async evidencia => {

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


          } catch (error) {

            console.error(
              'Error cargando evidencia para reporte:',
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
  }


  // ==========================================
  // CARGAR EXPEDIENTE PARA PDF
  // ==========================================

  async function cargarDetalleReporte() {

    if (!servicio?.id) {

      throw new Error(
        'No se encontró el servicio.'
      )
    }


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


    const evidencias =
      await cargarImagenesPrivadas(
        evidenciasResultado.data ||
        []
      )


    return {
      herramientas:
        herramientasResultado.data ||
        [],

      pagos:
        pagosResultado.data ||
        [],

      evidencias
    }
  }


  // ==========================================
  // LIBERAR FOTOS TEMPORALES
  // ==========================================

  function liberarEvidencias(
    detalle
  ) {

    (
      detalle?.evidencias ||
      []
    ).forEach(
      evidencia => {

        if (
          evidencia.preview_url
        ) {

          URL.revokeObjectURL(
            evidencia.preview_url
          )
        }
      }
    )
  }


  // ==========================================
  // TELEFONO WHATSAPP
  // ==========================================

  function obtenerTelefonoWhatsApp() {

    const telefono =
      cita
        ?.clientes
        ?.whatsapp ||
      cita
        ?.clientes
        ?.telefono ||
      ''


    let limpio =
      String(
        telefono
      ).replace(
        /\D/g,
        ''
      )


    if (
      limpio.length === 10
    ) {

      limpio =
        `52${limpio}`
    }


    if (
      limpio.startsWith(
        '521'
      ) &&
      limpio.length === 13
    ) {

      limpio =
        `52${limpio.slice(-10)}`
    }


    return limpio
  }


  // ==========================================
  // REGISTRAR ENVIO
  // ==========================================

  async function registrarEnvio() {

    const fecha =
      new Date()
        .toISOString()


    const {
      error
    } =
      await supabase
        .from('servicios')
        .update({
          reporte_enviado_cliente:
            true,

          fecha_reporte_enviado:
            fecha,

          reporte_enviado_por:
            perfil?.id ||
            null
        })
        .eq(
          'id',
          servicio.id
        )


    if (error) {

      console.error(
        'El reporte se compartió, pero no fue posible registrar el envío:',
        error
      )

      return
    }


    setServicio(
      anterior => ({
        ...anterior,

        reporte_enviado_cliente:
          true,

        fecha_reporte_enviado:
          fecha,

        reporte_enviado_por:
          perfil?.id ||
          null
      })
    )
  }


  // ==========================================
  // COMPARTIR REPORTE
  // ==========================================

  async function compartirReporte() {

    if (
      servicio?.confirmado_admin !==
      true
    ) {

      window.alert(
        'El reporte solo puede enviarse después de la confirmación del administrador.'
      )

      return
    }


    setCompartiendo(true)
    setMensaje('')


    let detalle = null


    try {

      detalle =
        await cargarDetalleReporte()


      const servicioParaReporte = {
        ...servicio,

        citas:
          cita
      }


      const {
        doc,
        nombreArchivo
      } =
        await generarReporteServicio({
          servicio:
            servicioParaReporte,

          detalleServicio:
            detalle
        })


      const blob =
        doc.output(
          'blob'
        )


      const archivo =
        new File(
          [blob],
          nombreArchivo,
          {
            type:
              'application/pdf'
          }
        )


      const nombreCliente =
        cita
          ?.clientes
          ?.nombre ||
        ''


      const texto =
        nombreCliente
          ? `Hola ${nombreCliente}. ${MENSAJE_AGRADECIMIENTO}`
          : MENSAJE_AGRADECIMIENTO


      let compartidoNativamente =
        false


      if (
        navigator.share
      ) {

        let puedeCompartir =
          true


        if (
          navigator.canShare
        ) {

          puedeCompartir =
            navigator.canShare({
              files:
                [archivo]
            })
        }


        if (
          puedeCompartir
        ) {

          try {

            await navigator.share({
              title:
                `Reporte ${servicio.folio}`,

              text:
                texto,

              files:
                [archivo]
            })


            compartidoNativamente =
              true


          } catch (error) {

            if (
              error?.name ===
              'AbortError'
            ) {

              return
            }


            console.warn(
              'El navegador no pudo compartir el archivo directamente:',
              error
            )
          }
        }
      }


      if (
        compartidoNativamente
      ) {

        await registrarEnvio()


        window.alert(
          'Reporte compartido correctamente.'
        )

        return
      }


      // ========================================
      // PLAN B
      // ========================================
      // En navegadores que no permiten adjuntar
      // archivos desde Web Share:
      // 1) descarga el PDF
      // 2) abre el WhatsApp del cliente
      // 3) el técnico adjunta el PDF descargado
      // ========================================

      doc.save(
        nombreArchivo
      )


      const telefono =
        obtenerTelefonoWhatsApp()


      if (telefono) {

        const url =
          `https://wa.me/${telefono}` +
          `?text=${encodeURIComponent(texto)}`


        window.open(
          url,
          '_blank'
        )
      }


      const enviado =
        window.confirm(
          'El PDF fue descargado y se abrió WhatsApp.\n\n' +
          'Adjunta el archivo PDF al mensaje del cliente.\n\n' +
          '¿Ya enviaste el reporte?'
        )


      if (enviado) {

        await registrarEnvio()
      }


    } catch (error) {

      console.error(
        'Error preparando reporte para cliente:',
        error
      )


      setMensaje(
        'No fue posible preparar el reporte: ' +
        (
          error?.message ||
          'Error desconocido'
        )
      )


    } finally {

      if (detalle) {
        liberarEvidencias(
          detalle
        )
      }


      setCompartiendo(false)
    }
  }


  // ==========================================
  // FECHA ENVIO
  // ==========================================

  function formatearFechaEnvio(
    valor
  ) {

    if (!valor) {
      return ''
    }


    return new Intl
      .DateTimeFormat(
        'es-MX',
        {
          dateStyle:
            'medium',

          timeStyle:
            'short'
        }
      )
      .format(
        new Date(
          valor
        )
      )
  }


  // ==========================================
  // UI
  // ==========================================

  if (cargando) {

    return (
      <div className="erc-waiting">
        Verificando confirmación administrativa...
      </div>
    )
  }


  if (mensaje) {

    return (
      <div className="erc-error">
        {mensaje}

        <button
          type="button"
          onClick={() =>
            cargarServicio()
          }
        >
          Reintentar
        </button>
      </div>
    )
  }


  if (!servicio) {

    return (
      <div className="erc-waiting">
        El servicio todavía no está disponible para generar reporte.
      </div>
    )
  }


  if (
    servicio.confirmado_admin !==
    true
  ) {

    return (
      <div className="erc-pending">

        <strong>
          ⏳ Esperando confirmación administrativa
        </strong>

        <span>
          Cuando el administrador apruebe el cierre, aquí aparecerá el botón para enviar el reporte al cliente.
        </span>

      </div>
    )
  }


  return (
    <div className="erc-confirmed">

      <div className="erc-confirmed-head">

        <div>

          <strong>
            ✓ Servicio confirmado por administración
          </strong>

          <span>
            El reporte final ya puede compartirse con el cliente.
          </span>

        </div>

        {
          servicio
            .reporte_enviado_cliente ===
            true && (

            <div className="erc-sent-badge">
              REPORTE ENVIADO
            </div>
          )
        }

      </div>


      {
        servicio
          .reporte_enviado_cliente ===
          true &&
        servicio
          .fecha_reporte_enviado && (

          <div className="erc-sent-date">
            Último envío:{' '}
            {
              formatearFechaEnvio(
                servicio
                  .fecha_reporte_enviado
              )
            }
          </div>
        )
      }


      <button
        type="button"
        className="erc-share-button"
        onClick={
          compartirReporte
        }
        disabled={
          compartiendo
        }
      >

        {
          compartiendo
            ? 'Preparando reporte...'
            : servicio
                .reporte_enviado_cliente
              ? '📄 REENVIAR REPORTE AL CLIENTE'
              : '📄 ENVIAR REPORTE AL CLIENTE'
        }

      </button>


      <div className="erc-help">
        En celular se abrirá el menú para compartir el PDF. Selecciona WhatsApp y el contacto del cliente.
      </div>

    </div>
  )
}


export default EnviarReporteCliente