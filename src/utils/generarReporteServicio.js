import { jsPDF } from 'jspdf'


// ======================================================
// IMÁGENES EMBEBIDAS
// ======================================================
//
// IMPORTANTE:
// Los 3 valores Base64 son muy largos.
// Para evitar que el chat corte el código y vuelva a dañarse,
// vamos a usar una solución más segura:
//
// Conserva las imágenes en:
// src/assets/logo-destapaya.png
// src/assets/Internet.png
// src/assets/facebook.png
//
// Pero esta vez jsPDF las convertirá mediante Canvas.
// ======================================================

import logoDestapaYaUrl from '../assets/logo-destapaya.png'
import iconoInternetUrl from '../assets/Internet.png'
import iconoFacebookUrl from '../assets/facebook.png'


// ======================================================
// DATOS DE DESTAPA YA
// ======================================================

const EMPRESA = {
  nombre: 'DESTAPA YA',

  lema:
    'RAPIDEZ, LIMPIEZA Y CONFIANZA',

  direccion1:
    'Valle del Sol 5829,',

  direccion2:
    'Colinas de Valle Verde,',

  direccion3:
    '64117 Monterrey, N.L.',

  telefono:
    '+52 81 4136 8849',

  sitio:
    'www.destapaya.com',

  sitioUrl:
    'https://www.destapaya.com',

  facebook:
    'Facebook Destapaya',

  facebookUrl:
    'https://www.facebook.com/profile.php?id=61590117905234'
}


// ======================================================
// COLORES
// ======================================================

const C = {
  marino:
    [13, 27, 61],

  azul:
    [0, 119, 204],

  azulClaro:
    [237, 248, 255],

  gris:
    [102, 112, 133],

  grisClaro:
    [248, 250, 252],

  borde:
    [218, 225, 234],

  blanco:
    [255, 255, 255],

  verde:
    [2, 122, 72]
}


// ======================================================
// CONVERTIR IMAGEN LOCAL A BASE64
// ======================================================

function imagenABase64(
  origen,
  formato = 'image/png'
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const imagen =
        new Image()


      imagen.onload = () => {

        try {

          const canvas =
            document.createElement(
              'canvas'
            )


          canvas.width =
            imagen.naturalWidth ||
            imagen.width


          canvas.height =
            imagen.naturalHeight ||
            imagen.height


          const contexto =
            canvas.getContext(
              '2d'
            )


          contexto.drawImage(
            imagen,
            0,
            0
          )


          const base64 =
            canvas.toDataURL(
              formato,
              0.92
            )


          resolve(
            base64
          )

        } catch (
          error
        ) {

          reject(
            error
          )
        }
      }


      imagen.onerror = () => {

        reject(
          new Error(
            `No se pudo cargar: ${origen}`
          )
        )
      }


      imagen.src =
        origen
    }
  )
}


// ======================================================
// UTILIDADES
// ======================================================

function textoSeguro(
  valor,
  reemplazo = '—'
) {

  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ''
  ) {

    return reemplazo
  }


  return String(
    valor
  )
}


// ======================================================
// MONEDA
// ======================================================

function formatearMoneda(
  valor
) {

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


// ======================================================
// FECHA
// ======================================================

function formatearFecha(
  valor
) {

  if (!valor) {

    return '—'
  }


  const fecha =
    String(
      valor
    ).includes('T')
      ? new Date(
          valor
        )
      : new Date(
          `${valor}T12:00:00`
        )


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day:
        '2-digit',

      month:
        'long',

      year:
        'numeric'
    }
  ).format(
    fecha
  )
}


// ======================================================
// FECHA Y HORA
// ======================================================

function formatearFechaHora(
  valor
) {

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


// ======================================================
// HORA
// ======================================================

function formatearHora(
  valor
) {

  if (!valor) {

    return '—'
  }


  const partes =
    String(
      valor
    ).split(':')


  let hora =
    Number(
      partes[0]
    )


  const minutos =
    partes[1] ||
    '00'


  const periodo =
    hora >= 12
      ? 'p. m.'
      : 'a. m.'


  hora =
    hora % 12 ||
    12


  return (
    `${hora}:${minutos} ${periodo}`
  )
}


// ======================================================
// DIRECCIÓN
// ======================================================

function obtenerDireccion(
  servicio
) {

  const direccion =
    servicio
      ?.citas
      ?.direcciones_cliente


  if (!direccion) {

    return (
      'Sin dirección registrada'
    )
  }


  return [
    direccion
      .nombre_ubicacion,

    direccion
      .calle,

    direccion
      .numero_exterior
      ? `#${direccion.numero_exterior}`
      : '',

    direccion
      .numero_interior
      ? `Int. ${direccion.numero_interior}`
      : '',

    direccion
      .colonia,

    direccion
      .municipio,

    direccion
      .estado,

    direccion
      .codigo_postal
      ? `C.P. ${direccion.codigo_postal}`
      : ''
  ]
    .filter(
      Boolean
    )
    .join(
      ', '
    )
}


// ======================================================
// TÉCNICOS
// ======================================================

function obtenerTecnicos(
  servicio
) {

  const registros =
    servicio
      ?.servicios_tecnicos ||
    []


  const nombres =
    registros
      .map(
        item =>
          item
            ?.perfiles
            ?.nombre
      )
      .filter(
        Boolean
      )


  return (
    nombres.join(
      ', '
    ) ||
    'Sin técnico registrado'
  )
}


// ======================================================
// VEHÍCULO
// ======================================================

function obtenerVehiculo(
  servicio
) {

  const vehiculo =
    servicio
      ?.citas
      ?.vehiculos


  if (!vehiculo) {

    return 'Sin asignar'
  }


  return [
    vehiculo
      .nombre_unidad,

    vehiculo
      .placas
  ]
    .filter(
      Boolean
    )
    .join(
      ' · '
    )
}


// ======================================================
// PAGO
// ======================================================

function obtenerPago(
  detalleServicio
) {

  const pagos =
    detalleServicio
      ?.pagos ||
    []


  return (
    pagos.find(
      item =>
        item.estatus ===
        'PAGADO'
    ) ||
    pagos[0] ||
    null
  )
}


// ======================================================
// CARGAR FOTOGRAFÍA DE EVIDENCIA
// ======================================================

async function cargarFoto(
  url
) {

  if (!url) {

    return null
  }


  try {

    const respuesta =
      await fetch(
        url
      )


    if (
      !respuesta.ok
    ) {

      return null
    }


    const blob =
      await respuesta.blob()


    return await new Promise(
      (
        resolve,
        reject
      ) => {

        const lector =
          new FileReader()


        lector.onloadend =
          () => {

            resolve(
              lector.result
            )
          }


        lector.onerror =
          reject


        lector.readAsDataURL(
          blob
        )
      }
    )

  } catch (
    error
  ) {

    console.error(
      'Error cargando fotografía:',
      error
    )


    return null
  }
}


// ======================================================
// CAJA
// ======================================================

function caja(
  doc,
  x,
  y,
  ancho,
  alto
) {

  doc.setFillColor(
    ...C.blanco
  )


  doc.setDrawColor(
    ...C.borde
  )


  doc.setLineWidth(
    0.3
  )


  doc.roundedRect(
    x,
    y,
    ancho,
    alto,
    2,
    2,
    'FD'
  )
}


// ======================================================
// TÍTULO DE SECCIÓN
// ======================================================

function tituloSeccion(
  doc,
  titulo,
  x,
  y
) {

  doc.setFont(
    'helvetica',
    'bold'
  )


  doc.setFontSize(
    8
  )


  doc.setTextColor(
    ...C.azul
  )


  doc.text(
    titulo,
    x,
    y
  )
}


// ======================================================
// CAMPO
// ======================================================

function campo(
  doc,
  etiqueta,
  valor,
  x,
  y,
  ancho,
  opciones = {}
) {

  const {
    fontSize = 7.2,
    lineasMax = 2,
    color = C.marino
  } =
    opciones


  doc.setFont(
    'helvetica',
    'bold'
  )


  doc.setFontSize(
    5.8
  )


  doc.setTextColor(
    ...C.azul
  )


  doc.text(
    etiqueta
      .toUpperCase(),
    x,
    y
  )


  doc.setFont(
    'helvetica',
    'normal'
  )


  doc.setFontSize(
    fontSize
  )


  doc.setTextColor(
    ...color
  )


  const lineas =
    doc
      .splitTextToSize(
        textoSeguro(
          valor
        ),
        ancho
      )
      .slice(
        0,
        lineasMax
      )


  doc.text(
    lineas,
    x,
    y + 4
  )
}


// ======================================================
// ENCABEZADO
// ======================================================

function dibujarEncabezado(
  doc,
  servicio,
  logoBase64
) {

  // ----------------------------------------------------
  // LOGO DESTAPA YA
  // ----------------------------------------------------

  if (
    logoBase64
  ) {

    try {

      doc.addImage(
        logoBase64,
        'PNG',
        10,
        5,
        42,
        34,
        undefined,
        'FAST'
      )

    } catch (
      error
    ) {

      console.error(
        'ERROR INSERTANDO LOGO:',
        error
      )
    }
  }


  // ----------------------------------------------------
  // DATOS DE DESTAPA YA
  // ----------------------------------------------------

  doc.setFont(
    'helvetica',
    'bold'
  )


  doc.setFontSize(
    9.2
  )


  doc.setTextColor(
    ...C.azul
  )


  doc.text(
    EMPRESA.nombre,
    60,
    10
  )


  doc.setFont(
    'helvetica',
    'normal'
  )


  doc.setFontSize(
    6.7
  )


  doc.setTextColor(
    ...C.marino
  )


  doc.text(
    EMPRESA.direccion1,
    60,
    16
  )


  doc.text(
    EMPRESA.direccion2,
    60,
    20
  )


  doc.text(
    EMPRESA.direccion3,
    60,
    24
  )


  doc.setFont(
    'helvetica',
    'bold'
  )


  doc.setFontSize(
    7.5
  )


  doc.text(
    EMPRESA.telefono,
    60,
    31
  )


  // ----------------------------------------------------
  // DIVISOR
  // ----------------------------------------------------

  doc.setDrawColor(
    ...C.borde
  )


  doc.line(
    135,
    6,
    135,
    38
  )


  // ----------------------------------------------------
  // REPORTE
  // ----------------------------------------------------

  doc.setFont(
    'helvetica',
    'bold'
  )


  doc.setFontSize(
    10
  )


  doc.setTextColor(
    ...C.marino
  )


  doc.text(
    'REPORTE DE SERVICIO',
    141,
    10
  )


  doc.setFillColor(
    ...C.azulClaro
  )


  doc.setDrawColor(
    ...C.azul
  )


  doc.roundedRect(
    141,
    14,
    58,
    13,
    1,
    1,
    'FD'
  )


  doc.setFontSize(
    5.5
  )


  doc.setTextColor(
    ...C.azul
  )


  doc.text(
    'FOLIO',
    145,
    18
  )


  doc.setFontSize(
    9
  )


  doc.setTextColor(
    ...C.marino
  )


  doc.text(
    textoSeguro(
      servicio?.folio
    ),
    170,
    23,
    {
      align:
        'center'
    }
  )


  doc.setFontSize(
    5.5
  )


  doc.setTextColor(
    ...C.azul
  )


  doc.text(
    'FECHA DE REPORTE',
    141,
    32
  )


  doc.setFont(
    'helvetica',
    'normal'
  )


  doc.setFontSize(
    6.5
  )


  doc.setTextColor(
    ...C.marino
  )


  doc.text(
    formatearFechaHora(
      servicio
        ?.fecha_confirmacion_admin ||
      new Date()
        .toISOString()
    ),
    141,
    36
  )


  doc.setDrawColor(
    ...C.azul
  )


  doc.setLineWidth(
    0.7
  )


  doc.line(
    10,
    43,
    200,
    43
  )
}


// ======================================================
// DATOS DEL SERVICIO
// ======================================================

function dibujarDatosServicio(
  doc,
  servicio,
  detalleServicio,
  y
) {

  const alto =
    39


  caja(
    doc,
    10,
    y,
    190,
    alto
  )


  tituloSeccion(
    doc,
    'DATOS DEL SERVICIO',
    15,
    y + 6
  )


  const pago =
    obtenerPago(
      detalleServicio
    )


  campo(
    doc,
    'Fecha de la cita',
    formatearFecha(
      servicio
        ?.citas
        ?.fecha
    ),
    15,
    y + 13,
    48
  )


  campo(
    doc,
    'Hora estimada',
    formatearHora(
      servicio
        ?.citas
        ?.hora_estimada
    ),
    15,
    y + 23,
    48
  )


  campo(
    doc,
    'Fecha de inicio',
    formatearFechaHora(
      servicio
        ?.fecha_inicio
    ),
    15,
    y + 33,
    48
  )


  campo(
    doc,
    'Tipo de servicio',
    servicio
      ?.citas
      ?.tipos_servicio
      ?.nombre,
    75,
    y + 13,
    50
  )


  campo(
    doc,
    'Estado',
    servicio
      ?.confirmado_admin
      ? 'CONFIRMADO POR ADMINISTRADOR'
      : servicio
          ?.estado
          ?.replaceAll(
            '_',
            ' '
          ),
    75,
    y + 23,
    50,
    {
      fontSize:
        6.6,

      color:
        servicio
          ?.confirmado_admin
          ? C.verde
          : C.marino
    }
  )


  campo(
    doc,
    'Confirmación',
    formatearFechaHora(
      servicio
        ?.fecha_confirmacion_admin
    ),
    75,
    y + 33,
    50
  )


  campo(
    doc,
    'Técnico',
    obtenerTecnicos(
      servicio
    ),
    137,
    y + 13,
    53
  )


  campo(
    doc,
    'Vehículo / unidad',
    obtenerVehiculo(
      servicio
    ),
    137,
    y + 23,
    53
  )


  campo(
    doc,
    'Método de pago',
    pago
      ?.metodos_pago
      ?.nombre,
    137,
    y + 33,
    53
  )


  return (
    y +
    alto +
    3
  )
}


// ======================================================
// FIN PARTE 1
// ======================================================
// ======================================================
// CLIENTE / DIRECCIÓN
// ======================================================

function dibujarCliente(
  doc,
  servicio,
  y
) {

  const alto =
    31


  caja(
    doc,
    10,
    y,
    190,
    alto
  )


  tituloSeccion(
    doc,
    'DATOS DEL CLIENTE',
    15,
    y + 6
  )


  campo(
    doc,
    'Nombre',
    servicio
      ?.citas
      ?.clientes
      ?.nombre,
    15,
    y + 13,
    47
  )


  campo(
    doc,
    'Teléfono',
    servicio
      ?.citas
      ?.clientes
      ?.telefono,
    15,
    y + 23,
    47
  )


  doc.setDrawColor(
    ...C.borde
  )


  doc.line(
    68,
    y + 5,
    68,
    y + 26
  )


  tituloSeccion(
    doc,
    'DIRECCIÓN DEL SERVICIO',
    74,
    y + 6
  )


  campo(
    doc,
    'Ubicación',
    obtenerDireccion(
      servicio
    ),
    74,
    y + 13,
    116,
    {
      fontSize:
        7,

      lineasMax:
        3
    }
  )


  return (
    y +
    alto +
    3
  )
}


// ======================================================
// DESCRIPCIÓN DEL SERVICIO
// ======================================================

function dibujarDescripcion(
  doc,
  servicio,
  y
) {

  const alto =
    36


  caja(
    doc,
    10,
    y,
    190,
    alto
  )


  tituloSeccion(
    doc,
    'DESCRIPCIÓN DEL SERVICIO',
    15,
    y + 6
  )


  const columnas = [

    {
      x:
        15,

      titulo:
        'PROBLEMA REPORTADO',

      valor:
        servicio
          ?.problema_reportado ||
        servicio
          ?.citas
          ?.descripcion_problema
    },


    {
      x:
        61,

      titulo:
        'DIAGNÓSTICO',

      valor:
        servicio
          ?.diagnostico
    },


    {
      x:
        107,

      titulo:
        'TRABAJO REALIZADO',

      valor:
        servicio
          ?.trabajo_realizado
    },


    {
      x:
        153,

      titulo:
        'RECOMENDACIONES',

      valor:
        servicio
          ?.recomendaciones ||
        'Sin recomendaciones.'
    }
  ]


  columnas.forEach(
    (
      item,
      indice
    ) => {

      if (
        indice > 0
      ) {

        doc.setDrawColor(
          ...C.borde
        )


        doc.line(
          item.x - 4,
          y + 10,
          item.x - 4,
          y + 31
        )
      }


      doc.setFont(
        'helvetica',
        'bold'
      )


      doc.setFontSize(
        5.4
      )


      doc.setTextColor(
        ...C.azul
      )


      doc.text(
        item.titulo,
        item.x,
        y + 13
      )


      doc.setFont(
        'helvetica',
        'normal'
      )


      doc.setFontSize(
        6.5
      )


      doc.setTextColor(
        ...C.marino
      )


      const lineas =
        doc
          .splitTextToSize(
            textoSeguro(
              item.valor
            ),
            40
          )
          .slice(
            0,
            5
          )


      doc.text(
        lineas,
        item.x,
        y + 18
      )
    }
  )


  return (
    y +
    alto +
    3
  )
}


// ======================================================
// HERRAMIENTAS Y PAGO
// ======================================================

function dibujarHerramientasPago(
  doc,
  detalleServicio,
  y
) {

  const alto =
    27


  caja(
    doc,
    10,
    y,
    190,
    alto
  )


  tituloSeccion(
    doc,
    'HERRAMIENTAS UTILIZADAS',
    15,
    y + 6
  )


  const herramientas =
    (
      detalleServicio
        ?.herramientas ||
      []
    )
      .map(
        item =>
          item
            ?.herramientas
            ?.nombre
      )
      .filter(
        Boolean
      )


  if (
    herramientas.length === 0
  ) {

    doc.setFont(
      'helvetica',
      'normal'
    )


    doc.setFontSize(
      6.5
    )


    doc.setTextColor(
      ...C.gris
    )


    doc.text(
      'Sin herramientas registradas.',
      15,
      y + 14
    )

  } else {

    herramientas
      .slice(
        0,
        6
      )
      .forEach(
        (
          nombre,
          indice
        ) => {

          const columna =
            indice < 3
              ? 0
              : 1


          const fila =
            indice % 3


          const x =
            columna === 0
              ? 15
              : 53


          const yy =
            y +
            13 +
            fila * 5


          doc.setFillColor(
            ...C.verde
          )


          doc.circle(
            x + 1.3,
            yy - 1.2,
            1,
            'F'
          )


          doc.setFont(
            'helvetica',
            'normal'
          )


          doc.setFontSize(
            6.4
          )


          doc.setTextColor(
            ...C.marino
          )


          doc.text(
            doc
              .splitTextToSize(
                nombre,
                31
              )[0],
            x + 4,
            yy
          )
        }
      )
  }


  // DIVISOR

  doc.setDrawColor(
    ...C.borde
  )


  doc.line(
    100,
    y + 5,
    100,
    y + 22
  )


  tituloSeccion(
    doc,
    'PAGO',
    106,
    y + 6
  )


  const pago =
    obtenerPago(
      detalleServicio
    )


  campo(
    doc,
    'Importe',
    pago
      ? formatearMoneda(
          pago.importe
        )
      : '—',
    106,
    y + 14,
    27
  )


  campo(
    doc,
    'Método',
    pago
      ?.metodos_pago
      ?.nombre,
    138,
    y + 14,
    26
  )


  campo(
    doc,
    'Estatus',
    pago
      ?.estatus,
    168,
    y + 14,
    24,
    {
      color:
        pago
          ?.estatus ===
          'PAGADO'
          ? C.verde
          : C.marino
    }
  )


  return (
    y +
    alto +
    3
  )
}


// ======================================================
// INSERTAR FOTO DE EVIDENCIA
// ======================================================

async function insertarFoto(
  doc,
  evidencia,
  x,
  y,
  ancho,
  alto
) {

  const origen =
    evidencia
      ?.preview_url ||
    evidencia
      ?.archivo_url


  if (!origen) {

    return
  }


  const imagen =
    await cargarFoto(
      origen
    )


  if (!imagen) {

    return
  }


  try {

    const formato =
      String(
        imagen
      )
        .startsWith(
          'data:image/png'
        )
        ? 'PNG'
        : 'JPEG'


    doc.addImage(
      imagen,
      formato,
      x,
      y,
      ancho,
      alto,
      undefined,
      'FAST'
    )

  } catch (
    error
  ) {

    console.error(
      'Error insertando evidencia:',
      error
    )
  }
}


// ======================================================
// EVIDENCIA FOTOGRÁFICA
// ======================================================

async function dibujarEvidencias(
  doc,
  detalleServicio,
  y
) {

  const evidencias =
    detalleServicio
      ?.evidencias ||
    []


  if (
    evidencias.length === 0
  ) {

    return y
  }


  const alto =
    42


  caja(
    doc,
    10,
    y,
    190,
    alto
  )


  tituloSeccion(
    doc,
    'EVIDENCIA FOTOGRÁFICA',
    15,
    y + 6
  )


  const grupos = [

    {
      tipo:
        'ANTES',

      titulo:
        'ANTES',

      x:
        15
    },


    {
      tipo:
        'DURANTE',

      titulo:
        'DURANTE',

      x:
        77
    },


    {
      tipo:
        'DESPUES',

      titulo:
        'DESPUÉS',

      x:
        139
    }
  ]


  for (
    const grupo
    of grupos
  ) {

    doc.setFont(
      'helvetica',
      'bold'
    )


    doc.setFontSize(
      6
    )


    doc.setTextColor(
      ...C.azul
    )


    doc.text(
      grupo.titulo,
      grupo.x,
      y + 12
    )


    const fotos =
      evidencias
        .filter(
          item =>
            String(
              item.tipo ||
              ''
            )
              .toUpperCase() ===
            grupo.tipo
        )
        .slice(
          0,
          2
        )


    let xFoto =
      grupo.x


    for (
      const foto
      of fotos
    ) {

      doc.setFillColor(
        ...C.grisClaro
      )


      doc.setDrawColor(
        ...C.borde
      )


      doc.roundedRect(
        xFoto,
        y + 15,
        27,
        21,
        1.5,
        1.5,
        'FD'
      )


      await insertarFoto(
        doc,
        foto,
        xFoto + 0.5,
        y + 15.5,
        26,
        20
      )


      xFoto +=
        29
    }
  }


  return (
    y +
    alto +
    3
  )
}


// ======================================================
// FOOTER
// ======================================================

function dibujarFooter(
  doc,
  internetBase64,
  facebookBase64
) {

  const y =
    268


  doc.setFillColor(
    ...C.marino
  )


  doc.roundedRect(
    10,
    y,
    190,
    18,
    2,
    2,
    'F'
  )


  // ====================================================
  // ICONO INTERNET
  // ====================================================

  if (
    internetBase64
  ) {

    try {

      doc.addImage(
        internetBase64,
        'PNG',
        15,
        y + 4,
        9,
        9,
        undefined,
        'FAST'
      )

    } catch (
      error
    ) {

      console.error(
        'ERROR ICONO INTERNET:',
        error
      )
    }
  }


  doc.setFont(
    'helvetica',
    'bold'
  )


  doc.setFontSize(
    5.5
  )


  doc.setTextColor(
    ...C.blanco
  )


  doc.text(
    'SITIO WEB',
    27,
    y + 5
  )


  doc.setFont(
    'helvetica',
    'normal'
  )


  doc.setFontSize(
    6.5
  )


  doc.setTextColor(
    90,
    195,
    255
  )


  doc.textWithLink(
    EMPRESA.sitio,
    27,
    y + 11,
    {
      url:
        EMPRESA.sitioUrl
    }
  )


  // ====================================================
  // ICONO FACEBOOK
  // ====================================================

  if (
    facebookBase64
  ) {

    try {

      doc.addImage(
        facebookBase64,
        'PNG',
        80,
        y + 4,
        9,
        9,
        undefined,
        'FAST'
      )

    } catch (
      error
    ) {

      console.error(
        'ERROR ICONO FACEBOOK:',
        error
      )
    }
  }


  doc.setFont(
    'helvetica',
    'bold'
  )


  doc.setFontSize(
    5.5
  )


  doc.setTextColor(
    ...C.blanco
  )


  doc.text(
    'FACEBOOK',
    92,
    y + 5
  )


  doc.setFont(
    'helvetica',
    'normal'
  )


  doc.setFontSize(
    6.5
  )


  doc.setTextColor(
    90,
    195,
    255
  )


  doc.textWithLink(
    EMPRESA.facebook,
    92,
    y + 11,
    {
      url:
        EMPRESA.facebookUrl
    }
  )


  // ====================================================
  // CONTACTO
  // ====================================================

  doc.setFont(
    'helvetica',
    'bold'
  )


  doc.setFontSize(
    5.5
  )


  doc.setTextColor(
    ...C.blanco
  )


  doc.text(
    'CONTACTO',
    157,
    y + 5
  )


  doc.setFont(
    'helvetica',
    'normal'
  )


  doc.setFontSize(
    6.5
  )


  doc.textWithLink(
    EMPRESA.telefono,
    157,
    y + 11,
    {
      url:
        'tel:+528141368849'
    }
  )


  // ====================================================
  // BARRA FINAL
  // ====================================================

  doc.setFillColor(
    ...C.azul
  )


  doc.rect(
    10,
    288,
    190,
    6,
    'F'
  )


  doc.setFont(
    'helvetica',
    'bold'
  )


  doc.setFontSize(
    7
  )


  doc.setTextColor(
    ...C.blanco
  )


  doc.text(
    EMPRESA.lema,
    105,
    292,
    {
      align:
        'center'
    }
  )
}


// ======================================================
// GENERAR REPORTE
// ======================================================

export async function generarReporteServicio({
  servicio,
  detalleServicio
}) {

  if (
    !servicio
  ) {

    throw new Error(
      'No se recibió información del servicio.'
    )
  }


  // ====================================================
  // CONVERTIR LOGOS A BASE64 ANTES DE CREAR EL PDF
  // ====================================================

  let logoBase64 =
    null

  let internetBase64 =
    null

  let facebookBase64 =
    null


  try {

    logoBase64 =
      await imagenABase64(
        logoDestapaYaUrl,
        'image/png'
      )

  } catch (
    error
  ) {

    console.error(
      'ERROR CARGANDO LOGO DESTAPA YA:',
      error
    )
  }


  try {

    internetBase64 =
      await imagenABase64(
        iconoInternetUrl,
        'image/png'
      )

  } catch (
    error
  ) {

    console.error(
      'ERROR CARGANDO INTERNET:',
      error
    )
  }


  try {

    facebookBase64 =
      await imagenABase64(
        iconoFacebookUrl,
        'image/png'
      )

  } catch (
    error
  ) {

    console.error(
      'ERROR CARGANDO FACEBOOK:',
      error
    )
  }


  // ====================================================
  // CREAR PDF
  // ====================================================

  const doc =
    new jsPDF({
      orientation:
        'portrait',

      unit:
        'mm',

      format:
        'a4',

      compress:
        true
    })


  // ====================================================
  // ENCABEZADO
  // ====================================================

  dibujarEncabezado(
    doc,
    servicio,
    logoBase64
  )


  let y =
    46


  // ====================================================
  // DATOS DEL SERVICIO
  // ====================================================

  y =
    dibujarDatosServicio(
      doc,
      servicio,
      detalleServicio,
      y
    )


  // ====================================================
  // CLIENTE
  // ====================================================

  y =
    dibujarCliente(
      doc,
      servicio,
      y
    )


  // ====================================================
  // DESCRIPCIÓN
  // ====================================================

  y =
    dibujarDescripcion(
      doc,
      servicio,
      y
    )


  // ====================================================
  // HERRAMIENTAS Y PAGO
  // ====================================================

  y =
    dibujarHerramientasPago(
      doc,
      detalleServicio,
      y
    )


  // ====================================================
  // EVIDENCIAS
  // ====================================================

  await dibujarEvidencias(
    doc,
    detalleServicio,
    y
  )


  // ====================================================
  // FOOTER
  // ====================================================

  dibujarFooter(
    doc,
    internetBase64,
    facebookBase64
  )


  // ====================================================
  // METADATOS
  // ====================================================

  doc.setProperties({
    title:
      `Reporte ${servicio.folio || ''}`,

    subject:
      'Reporte ejecutivo de servicio DESTAPA YA',

    author:
      EMPRESA.nombre,

    creator:
      'Sistema DESTAPA YA'
  })


  const nombreArchivo =
    `Reporte_${servicio.folio || 'Servicio'}.pdf`


  return {
    doc,
    nombreArchivo
  }
}


// ======================================================
// DESCARGAR PDF
// ======================================================

export async function descargarReporteServicio(
  datos
) {

  const {
    doc,
    nombreArchivo
  } =
    await generarReporteServicio(
      datos
    )


  doc.save(
    nombreArchivo
  )
}


// ======================================================
// VER PDF
// ======================================================

export async function verReporteServicio(
  datos
) {

  const {
    doc
  } =
    await generarReporteServicio(
      datos
    )


  const blob =
    doc.output(
      'blob'
    )


  const url =
    URL.createObjectURL(
      blob
    )


  window.open(
    url,
    '_blank'
  )


  setTimeout(
    () => {

      URL.revokeObjectURL(
        url
      )

    },
    120000
  )
}


// ======================================================
// FIN DEL ARCHIVO
// ======================================================