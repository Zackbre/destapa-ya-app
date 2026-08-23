import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { supabase } from '../supabase'

import "./clientes.css";


function Clientes({
  onVolver,
  onNuevaCitaCliente,
  onVerServicio
}) {

  // ==========================================
  // ESTADOS GENERALES
  // ==========================================

  const [
    clientes,
    setClientes
  ] =
    useState([])

  const [
    cargando,
    setCargando
  ] =
    useState(true)

  const [
    mensaje,
    setMensaje
  ] =
    useState('')

  const [
    busqueda,
    setBusqueda
  ] =
    useState('')

  const [
    filtroTipo,
    setFiltroTipo
  ] =
    useState('TODOS')


  // ==========================================
  // CLIENTE SELECCIONADO
  // ==========================================

  const [
    clienteSeleccionado,
    setClienteSeleccionado
  ] =
    useState(null)

  const [
    cargandoDetalle,
    setCargandoDetalle
  ] =
    useState(false)

  const [
    direcciones,
    setDirecciones
  ] =
    useState([])

  const [
    servicios,
    setServicios
  ] =
    useState([])

  const [
    pagos,
    setPagos
  ] =
    useState([])


  // ==========================================
  // EDITAR CLIENTE
  // ==========================================

  const [
    editandoCliente,
    setEditandoCliente
  ] =
    useState(false)

  const [
    guardandoCliente,
    setGuardandoCliente
  ] =
    useState(false)

  const [
    formularioCliente,
    setFormularioCliente
  ] =
    useState({
      nombre: '',
      tipo_cliente: 'RESIDENCIAL',
      telefono: '',
      whatsapp: '',
      razon_social: '',
      rfc: '',
      contacto_administrativo: '',
      telefono_contacto: '',
      correo_administrativo: '',
      notas: '',
      activo: true
    })


  // ==========================================
  // DIRECCIONES
  // ==========================================

  const [
    mostrandoFormularioDireccion,
    setMostrandoFormularioDireccion
  ] =
    useState(false)

  const [
    direccionEditando,
    setDireccionEditando
  ] =
    useState(null)

  const [
    guardandoDireccion,
    setGuardandoDireccion
  ] =
    useState(false)

  const [
    formularioDireccion,
    setFormularioDireccion
  ] =
    useState({
      nombre_ubicacion: '',
      calle: '',
      numero_exterior: '',
      numero_interior: '',
      colonia: '',
      municipio: '',
      estado: 'Nuevo León',
      codigo_postal: '',
      referencias: '',
      latitud: '',
      longitud: '',
      es_principal: false
    })


  // ==========================================
  // CARGAR CLIENTES AL INICIAR
  // ==========================================

  useEffect(() => {

    cargarClientes()

  }, [])


  // ==========================================
  // CARGAR CLIENTES
  // ==========================================

  async function cargarClientes() {

    setCargando(true)
    setMensaje('')


    try {

      const {
        data,
        error
      } =
        await supabase
          .from('clientes')
          .select(`
            id,
            tipo_cliente,
            nombre,
            telefono,
            whatsapp,
            razon_social,
            rfc,
            contacto_administrativo,
            telefono_contacto,
            correo_administrativo,
            notas,
            activo
          `)
          .order(
            'nombre',
            {
              ascending: true
            }
          )


      if (error) {
        throw error
      }


      setClientes(
        data || []
      )


    } catch (
      error
    ) {

      console.error(
        'Error cargando clientes:',
        error
      )


      setMensaje(
        'No fue posible cargar los clientes: ' +
        error.message
      )


    } finally {

      setCargando(false)
    }
  }


  // ==========================================
  // CLIENTES FILTRADOS
  // ==========================================

  const clientesFiltrados =
    useMemo(
      () => {

        const texto =
          busqueda
            .trim()
            .toLowerCase()


        return clientes.filter(
          cliente => {

            const tipoCliente =
              String(
                cliente.tipo_cliente ||
                ''
              )
                .trim()
                .toUpperCase()


            const coincideTipo =
              filtroTipo ===
              'TODOS'
                ? true
                : tipoCliente ===
                  filtroTipo


            if (
              !coincideTipo
            ) {
              return false
            }


            if (
              !texto
            ) {
              return true
            }


            const contenido =
              [
                cliente.nombre,
                cliente.telefono,
                cliente.whatsapp,
                cliente.razon_social,
                cliente.rfc,
                cliente.contacto_administrativo
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()


            return contenido.includes(
              texto
            )
          }
        )

      },
      [
        clientes,
        busqueda,
        filtroTipo
      ]
    )


  // ==========================================
  // KPIs GENERALES
  // ==========================================

  const totalClientes =
    clientes.length


  const clientesActivos =
    clientes.filter(
      cliente =>
        cliente.activo !==
        false
    ).length


  const residenciales =
    clientes.filter(
      cliente =>
        String(
          cliente.tipo_cliente ||
          ''
        )
          .toUpperCase() ===
        'RESIDENCIAL'
    ).length


  const comerciales =
    clientes.filter(
      cliente =>
        String(
          cliente.tipo_cliente ||
          ''
        )
          .toUpperCase() ===
        'COMERCIAL'
    ).length


  // ==========================================
  // ABRIR EXPEDIENTE
  // ==========================================

  async function abrirCliente(
    cliente
  ) {

    setClienteSeleccionado(
      cliente
    )

    setFormularioCliente({
      nombre:
        cliente.nombre || '',

      tipo_cliente:
        cliente.tipo_cliente ||
        'RESIDENCIAL',

      telefono:
        cliente.telefono || '',

      whatsapp:
        cliente.whatsapp || '',

      razon_social:
        cliente.razon_social || '',

      rfc:
        cliente.rfc || '',

      contacto_administrativo:
        cliente.contacto_administrativo ||
        '',

      telefono_contacto:
        cliente.telefono_contacto ||
        '',

      correo_administrativo:
        cliente.correo_administrativo ||
        '',

      notas:
        cliente.notas || '',

      activo:
        cliente.activo !== false
    })

    setEditandoCliente(false)

    setMostrandoFormularioDireccion(
      false
    )

    setDireccionEditando(
      null
    )

    setDirecciones([])
    setServicios([])
    setPagos([])

    setCargandoDetalle(
      true
    )

    setMensaje('')


    try {

      // ======================================
      // 1. CITAS DEL CLIENTE
      //
      // Se utiliza la relación clientes!inner
      // que ya quedó funcionando.
      // ======================================

      const {
        data:
          citasCliente,

        error:
          errorCitas

      } =
        await supabase
          .from('citas')
          .select(`
            id,
            fecha,
            hora_estimada,
            descripcion_problema,
            observaciones,
            estado,

            clientes!inner (
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
              referencias,
              latitud,
              longitud,
              es_principal
            ),

            tipos_servicio (
              id,
              nombre
            )
          `)
          .eq(
            'clientes.id',
            cliente.id
          )
          .order(
            'fecha',
            {
              ascending:
                false
            }
          )
          .order(
            'hora_estimada',
            {
              ascending:
                false
            }
          )


      if (
        errorCitas
      ) {

        throw new Error(
          'Error consultando citas: ' +
          errorCitas.message
        )
      }


      const citas =
        citasCliente ||
        []


      // ======================================
      // 2. DIRECCIONES UTILIZADAS
      // ======================================

      const mapaDirecciones =
        new Map()


      citas.forEach(
        cita => {

          const direccion =
            cita
              ?.direcciones_cliente


          if (
            direccion &&
            direccion.id
          ) {

            mapaDirecciones.set(
              direccion.id,
              direccion
            )
          }

        }
      )


      // ======================================
      // 3. CONSULTAR TODAS LAS DIRECCIONES
      //
      // Primero intentamos cliente_id.
      // Si la instalación usa otro nombre,
      // seguimos conservando las obtenidas
      // mediante las citas.
      // ======================================

      try {

        const {
          data:
            direccionesDirectas,

          error:
            errorDirecciones

        } =
          await supabase
            .from(
              'direcciones_cliente'
            )
            .select(`
              id,
              nombre_ubicacion,
              calle,
              numero_exterior,
              numero_interior,
              colonia,
              municipio,
              estado,
              codigo_postal,
              referencias,
              latitud,
              longitud,
              es_principal
            `)
            .eq(
              'cliente_id',
              cliente.id
            )


        if (
          !errorDirecciones
        ) {

          (
            direccionesDirectas ||
            []
          ).forEach(
            direccion => {

              if (
                direccion?.id
              ) {

                mapaDirecciones.set(
                  direccion.id,
                  direccion
                )
              }

            }
          )
        }

      } catch (
        errorDireccion
      ) {

        console.warn(
          'No se pudieron cargar direcciones directamente. Se usarán las relacionadas a citas.',
          errorDireccion
        )
      }


      const direccionesCliente =
        Array.from(
          mapaDirecciones.values()
        )
          .sort(
            (
              a,
              b
            ) => {

              if (
                a.es_principal ===
                b.es_principal
              ) {
                return 0
              }

              return a.es_principal
                ? -1
                : 1
            }
          )


      // ======================================
      // 4. SERVICIOS POR CITA
      // ======================================

      const idsCitas =
        citas
          .map(
            cita =>
              cita.id
          )
          .filter(Boolean)


      let serviciosReales =
        []


      if (
        idsCitas.length > 0
      ) {

        const {
          data:
            datosServicios,

          error:
            errorServicios

        } =
          await supabase
            .from('servicios')
            .select(`
              id,
              folio,
              cita_id,
              estado,
              fecha_inicio,
              diagnostico,
              trabajo_realizado,
              recomendaciones,
              confirmado_admin,
              fecha_confirmacion_admin
            `)
            .in(
              'cita_id',
              idsCitas
            )
            .order(
              'id',
              {
                ascending:
                  false
              }
            )


        if (
          errorServicios
        ) {

          throw new Error(
            'Error consultando servicios: ' +
            errorServicios.message
          )
        }


        serviciosReales =
          datosServicios ||
          []
      }


      // ======================================
      // 5. HISTORIAL COMPLETO
      // ======================================

      const historial =
        citas.map(
          cita => {

            const servicioReal =
              serviciosReales.find(
                servicio =>
                  Number(
                    servicio.cita_id
                  ) ===
                  Number(
                    cita.id
                  )
              )


            if (
              servicioReal
            ) {

              return {

                ...servicioReal,

                citas:
                  cita,

                tieneServicio:
                  true,

                servicioRealId:
                  servicioReal.id

              }
            }


            return {

              id:
                `CITA-${cita.id}`,

              folio:
                `CITA-${String(
                  cita.id
                ).padStart(
                  5,
                  '0'
                )}`,

              cita_id:
                cita.id,

              estado:
                cita.estado ||
                'PROGRAMADO',

              fecha_inicio:
                null,

              diagnostico:
                null,

              trabajo_realizado:
                null,

              recomendaciones:
                null,

              confirmado_admin:
                false,

              fecha_confirmacion_admin:
                null,

              citas:
                cita,

              tieneServicio:
                false,

              servicioRealId:
                null

            }

          }
        )


      // ======================================
      // 6. PAGOS
      // ======================================

      let pagosCliente =
        []


      const idsServicios =
        serviciosReales
          .map(
            servicio =>
              servicio.id
          )
          .filter(Boolean)


      if (
        idsServicios.length > 0
      ) {

        const {
          data:
            datosPagos,

          error:
            errorPagos

        } =
          await supabase
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
            .in(
              'servicio_id',
              idsServicios
            )


        if (
          errorPagos
        ) {

          throw new Error(
            'Error consultando pagos: ' +
            errorPagos.message
          )
        }


        pagosCliente =
          datosPagos ||
          []
      }


      // ======================================
      // 7. GUARDAR RESULTADOS
      // ======================================

      setDirecciones(
        direccionesCliente
      )

      setServicios(
        historial
      )

      setPagos(
        pagosCliente
      )


    } catch (
      error
    ) {

      console.error(
        'Error cargando expediente del cliente:',
        error
      )


      setMensaje(
        'No fue posible cargar la ficha del cliente: ' +
        error.message
      )


    } finally {

      setCargandoDetalle(
        false
      )
    }
  }


  // ==========================================
  // CERRAR EXPEDIENTE
  // ==========================================

  function cerrarCliente() {

    setClienteSeleccionado(
      null
    )

    setDirecciones([])
    setServicios([])
    setPagos([])

    setEditandoCliente(
      false
    )

    setMostrandoFormularioDireccion(
      false
    )

    setDireccionEditando(
      null
    )

    setMensaje('')
  }


  // ==========================================
  // CAMBIAR FORMULARIO CLIENTE
  // ==========================================

  function cambiarCliente(
    campo,
    valor
  ) {

    setFormularioCliente(
      anterior => ({
        ...anterior,
        [campo]:
          valor
      })
    )
  }


  // ==========================================
  // INICIAR EDICIÓN CLIENTE
  // ==========================================

  function iniciarEdicionCliente() {

    if (
      !clienteSeleccionado
    ) {
      return
    }


    setFormularioCliente({

      nombre:
        clienteSeleccionado
          .nombre ||
        '',

      tipo_cliente:
        clienteSeleccionado
          .tipo_cliente ||
        'RESIDENCIAL',

      telefono:
        clienteSeleccionado
          .telefono ||
        '',

      whatsapp:
        clienteSeleccionado
          .whatsapp ||
        '',

      razon_social:
        clienteSeleccionado
          .razon_social ||
        '',

      rfc:
        clienteSeleccionado
          .rfc ||
        '',

      contacto_administrativo:
        clienteSeleccionado
          .contacto_administrativo ||
        '',

      telefono_contacto:
        clienteSeleccionado
          .telefono_contacto ||
        '',

      correo_administrativo:
        clienteSeleccionado
          .correo_administrativo ||
        '',

      notas:
        clienteSeleccionado
          .notas ||
        '',

      activo:
        clienteSeleccionado
          .activo !==
        false
    })


    setEditandoCliente(
      true
    )
  }


  // ==========================================
  // CANCELAR EDICIÓN CLIENTE
  // ==========================================

  function cancelarEdicionCliente() {

    setEditandoCliente(
      false
    )
  }


  // ==========================================
  // GUARDAR CLIENTE
  // ==========================================

  async function guardarCliente() {

    if (
      !clienteSeleccionado
    ) {
      return
    }


    if (
      !formularioCliente
        .nombre
        .trim()
    ) {

      window.alert(
        'El nombre del cliente es obligatorio.'
      )

      return
    }


    if (
      !formularioCliente
        .telefono
        .trim()
    ) {

      window.alert(
        'El teléfono del cliente es obligatorio.'
      )

      return
    }


    setGuardandoCliente(
      true
    )


    try {

      const datosActualizar = {

        nombre:
          formularioCliente
            .nombre
            .trim(),

        tipo_cliente:
          formularioCliente
            .tipo_cliente,

        telefono:
          formularioCliente
            .telefono
            .trim(),

        whatsapp:
          formularioCliente
            .whatsapp
            .trim() ||
          null,

        razon_social:
          formularioCliente
            .razon_social
            .trim() ||
          null,

        rfc:
          formularioCliente
            .rfc
            .trim()
            .toUpperCase() ||
          null,

        contacto_administrativo:
          formularioCliente
            .contacto_administrativo
            .trim() ||
          null,

        telefono_contacto:
          formularioCliente
            .telefono_contacto
            .trim() ||
          null,

        correo_administrativo:
          formularioCliente
            .correo_administrativo
            .trim()
            .toLowerCase() ||
          null,

        notas:
          formularioCliente
            .notas
            .trim() ||
          null,

        activo:
          Boolean(
            formularioCliente.activo
          )
      }


      const {
        data,
        error
      } =
        await supabase
          .from('clientes')
          .update(
            datosActualizar
          )
          .eq(
            'id',
            clienteSeleccionado.id
          )
          .select(`
            id,
            tipo_cliente,
            nombre,
            telefono,
            whatsapp,
            razon_social,
            rfc,
            contacto_administrativo,
            telefono_contacto,
            correo_administrativo,
            notas,
            activo
          `)
          .single()


      if (error) {
        throw error
      }


      setClienteSeleccionado(
        data
      )


      setEditandoCliente(
        false
      )


      await cargarClientes()


      window.alert(
        'Cliente actualizado correctamente.'
      )


    } catch (
      error
    ) {

      console.error(
        'Error actualizando cliente:',
        error
      )


      window.alert(
        'No fue posible actualizar el cliente:\n\n' +
        error.message
      )


    } finally {

      setGuardandoCliente(
        false
      )
    }
  }


  // ==========================================
  // FORMULARIO DIRECCIÓN VACÍO
  // ==========================================

  function obtenerDireccionVacia() {

    return {
      nombre_ubicacion: '',
      calle: '',
      numero_exterior: '',
      numero_interior: '',
      colonia: '',
      municipio: '',
      estado: 'Nuevo León',
      codigo_postal: '',
      referencias: '',
      latitud: '',
      longitud: '',
      es_principal: false
    }
  }


  // ==========================================
  // CAMBIAR FORMULARIO DIRECCIÓN
  // ==========================================

  function cambiarDireccion(
    campo,
    valor
  ) {

    setFormularioDireccion(
      anterior => ({
        ...anterior,
        [campo]:
          valor
      })
    )
  }


  // ==========================================
  // NUEVA DIRECCIÓN
  // ==========================================

  function nuevaDireccion() {

    setDireccionEditando(
      null
    )

    setFormularioDireccion(
      obtenerDireccionVacia()
    )

    setMostrandoFormularioDireccion(
      true
    )
  }


  // ==========================================
  // EDITAR DIRECCIÓN
  // ==========================================

  function editarDireccion(
    direccion
  ) {

    setDireccionEditando(
      direccion
    )


    setFormularioDireccion({

      nombre_ubicacion:
        direccion
          .nombre_ubicacion ||
        '',

      calle:
        direccion
          .calle ||
        '',

      numero_exterior:
        direccion
          .numero_exterior ||
        '',

      numero_interior:
        direccion
          .numero_interior ||
        '',

      colonia:
        direccion
          .colonia ||
        '',

      municipio:
        direccion
          .municipio ||
        '',

      estado:
        direccion
          .estado ||
        'Nuevo León',

      codigo_postal:
        direccion
          .codigo_postal ||
        '',

      referencias:
        direccion
          .referencias ||
        '',

      latitud:
        direccion
          .latitud ??
        '',

      longitud:
        direccion
          .longitud ??
        '',

      es_principal:
        Boolean(
          direccion
            .es_principal
        )
    })


    setMostrandoFormularioDireccion(
      true
    )
  }


  // ==========================================
  // CANCELAR DIRECCIÓN
  // ==========================================

  function cancelarDireccion() {

    setMostrandoFormularioDireccion(
      false
    )

    setDireccionEditando(
      null
    )

    setFormularioDireccion(
      obtenerDireccionVacia()
    )
  }


  // ==========================================
  // DATOS PARA GUARDAR DIRECCIÓN
  // ==========================================

  function prepararDatosDireccion() {

    return {

      nombre_ubicacion:
        formularioDireccion
          .nombre_ubicacion
          .trim() ||
        'Casa',

      calle:
        formularioDireccion
          .calle
          .trim(),

      numero_exterior:
        formularioDireccion
          .numero_exterior
          .trim(),

      numero_interior:
        formularioDireccion
          .numero_interior
          .trim() ||
        null,

      colonia:
        formularioDireccion
          .colonia
          .trim(),

      municipio:
        formularioDireccion
          .municipio
          .trim(),

      estado:
        formularioDireccion
          .estado
          .trim(),

      codigo_postal:
        formularioDireccion
          .codigo_postal
          .trim(),

      referencias:
        formularioDireccion
          .referencias
          .trim() ||
        null,

      latitud:
        formularioDireccion
          .latitud ===
        ''
          ? null
          : Number(
              formularioDireccion
                .latitud
            ),

      longitud:
        formularioDireccion
          .longitud ===
        ''
          ? null
          : Number(
              formularioDireccion
                .longitud
            ),

      es_principal:
        Boolean(
          formularioDireccion
            .es_principal
        )
    }
  }


  // ==========================================
  // MARCAR OTRAS DIRECCIONES COMO NO PRINCIPAL
  // ==========================================

  async function quitarPrincipalOtras(
    direccionExcluirId =
      null
  ) {

    if (
      !clienteSeleccionado
    ) {
      return
    }


    // Intentamos primero con cliente_id.
    // Si la instalación no permite esta consulta,
    // no bloqueamos el guardado de la dirección.

    try {

      let consulta =
        supabase
          .from(
            'direcciones_cliente'
          )
          .update({
            es_principal:
              false
          })
          .eq(
            'cliente_id',
            clienteSeleccionado.id
          )


      if (
        direccionExcluirId
      ) {

        consulta =
          consulta.neq(
            'id',
            direccionExcluirId
          )
      }


      const {
        error
      } =
        await consulta


      if (
        error
      ) {

        console.warn(
          'No fue posible desmarcar otras direcciones principales:',
          error
        )
      }

    } catch (
      error
    ) {

      console.warn(
        'No fue posible actualizar dirección principal:',
        error
      )
    }
  }


  // ==========================================
  // INSERTAR DIRECCIÓN CON CAMPO DE RELACIÓN
  // ==========================================

  async function insertarDireccionNueva(
    datosDireccion
  ) {

    if (
      !clienteSeleccionado
    ) {

      throw new Error(
        'No hay un cliente seleccionado.'
      )
    }


    // ------------------------------------------
    // INTENTO 1: cliente_id
    // ------------------------------------------

    const intentoClienteId =
      await supabase
        .from(
          'direcciones_cliente'
        )
        .insert({
          ...datosDireccion,

          cliente_id:
            clienteSeleccionado.id
        })
        .select()
        .single()


    if (
      !intentoClienteId.error
    ) {

      return intentoClienteId.data
    }


    const mensajeError =
      String(
        intentoClienteId
          .error
          ?.message ||
        ''
      )
        .toLowerCase()


    const errorColumna =
      mensajeError.includes(
        'cliente_id'
      ) &&
      (
        mensajeError.includes(
          'does not exist'
        ) ||
        mensajeError.includes(
          'schema cache'
        ) ||
        mensajeError.includes(
          'column'
        )
      )


    if (
      !errorColumna
    ) {

      throw intentoClienteId.error
    }


    // ------------------------------------------
    // INTENTO 2: id_cliente
    //
    // Solo se usa como respaldo si cliente_id
    // realmente no existe.
    // ------------------------------------------

    const intentoIdCliente =
      await supabase
        .from(
          'direcciones_cliente'
        )
        .insert({
          ...datosDireccion,

          id_cliente:
            clienteSeleccionado.id
        })
        .select()
        .single()


    if (
      intentoIdCliente.error
    ) {

      throw intentoIdCliente.error
    }


    return intentoIdCliente.data
  }


  // ==========================================
  // GUARDAR DIRECCIÓN
  // ==========================================

  async function guardarDireccion() {

    if (
      !clienteSeleccionado
    ) {
      return
    }


    if (
      !formularioDireccion
        .calle
        .trim()
    ) {

      window.alert(
        'La calle es obligatoria.'
      )

      return
    }


    if (
      !formularioDireccion
        .numero_exterior
        .trim()
    ) {

      window.alert(
        'El número exterior es obligatorio.'
      )

      return
    }


    if (
      !formularioDireccion
        .colonia
        .trim()
    ) {

      window.alert(
        'La colonia es obligatoria.'
      )

      return
    }


    if (
      !formularioDireccion
        .municipio
        .trim()
    ) {

      window.alert(
        'El municipio es obligatorio.'
      )

      return
    }


    setGuardandoDireccion(
      true
    )


    try {

      const datosDireccion =
        prepararDatosDireccion()


      // ======================================
      // SI SERÁ PRINCIPAL
      // ======================================

      if (
        datosDireccion
          .es_principal
      ) {

        await quitarPrincipalOtras(
          direccionEditando
            ?.id ||
          null
        )
      }


      // ======================================
      // EDITAR
      // ======================================

      if (
        direccionEditando
          ?.id
      ) {

        const {
          error
        } =
          await supabase
            .from(
              'direcciones_cliente'
            )
            .update(
              datosDireccion
            )
            .eq(
              'id',
              direccionEditando.id
            )


        if (error) {
          throw error
        }


      } else {

        // ====================================
        // NUEVA
        // ====================================

        await insertarDireccionNueva(
          datosDireccion
        )
      }


      setMostrandoFormularioDireccion(
        false
      )

      setDireccionEditando(
        null
      )

      setFormularioDireccion(
        obtenerDireccionVacia()
      )


      // Recargar expediente completo
      await abrirCliente(
        clienteSeleccionado
      )


      window.alert(
        direccionEditando
          ? 'Dirección actualizada correctamente.'
          : 'Dirección agregada correctamente.'
      )


    } catch (
      error
    ) {

      console.error(
        'Error guardando dirección:',
        error
      )


      window.alert(
        'No fue posible guardar la dirección:\n\n' +
        error.message
      )


    } finally {

      setGuardandoDireccion(
        false
      )
    }
  }


  // ==========================================
  // WHATSAPP
  // ==========================================

  function abrirWhatsApp(
    cliente
  ) {

    const telefono =
      cliente.whatsapp ||
      cliente.telefono


    if (!telefono) {

      window.alert(
        'El cliente no tiene un número registrado.'
      )

      return
    }


    let numero =
      String(
        telefono
      ).replace(
        /\D/g,
        ''
      )


    if (
      numero.length ===
      10
    ) {

      numero =
        `52${numero}`
    }


    const mensajeWhatsApp =
      `Hola ${cliente.nombre}, te contactamos de DESTAPA YA.`


    const url =
      `https://wa.me/${numero}` +
      `?text=${encodeURIComponent(
        mensajeWhatsApp
      )}`


    window.open(
      url,
      '_blank'
    )
  }


  // ==========================================
  // LLAMAR
  // ==========================================

  function llamar(
    cliente
  ) {

    if (
      !cliente.telefono
    ) {

      window.alert(
        'El cliente no tiene teléfono registrado.'
      )

      return
    }


    window.location.href =
      `tel:${cliente.telefono}`
  }


  // ==========================================
  // FORMATEAR MONEDA
  // ==========================================

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


  // ==========================================
  // FORMATEAR FECHA
  // ==========================================

  function formatearFecha(
    valor
  ) {

    if (!valor) {
      return '—'
    }


    const fecha =
      String(valor)
        .includes('T')

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


  // ==========================================
  // FORMATEAR DIRECCIÓN
  // ==========================================

  function obtenerDireccion(
    direccion
  ) {

    if (!direccion) {
      return '—'
    }


    return [

      direccion.calle,

      direccion.numero_exterior
        ? `#${direccion.numero_exterior}`
        : '',

      direccion.numero_interior
        ? `Int. ${direccion.numero_interior}`
        : '',

      direccion.colonia,

      direccion.municipio,

      direccion.estado,

      direccion.codigo_postal
        ? `C.P. ${direccion.codigo_postal}`
        : ''

    ]
      .filter(Boolean)
      .join(', ')
  }


  // ==========================================
  // TOTAL PAGADO
  // ==========================================

  const totalPagado =
    pagos
      .filter(
        pago =>
          String(
            pago.estatus ||
            ''
          )
            .toUpperCase() ===
          'PAGADO'
      )
      .reduce(
        (
          acumulado,
          pago
        ) =>
          acumulado +
          Number(
            pago.importe ||
            0
          ),
        0
      )


  // ==========================================
  // PAGO POR SERVICIO
  // ==========================================

  function obtenerPagoServicio(
    servicio
  ) {

    const servicioId =
      servicio
        ?.servicioRealId ||
      (
        typeof servicio
          ?.id ===
        'number'
          ? servicio.id
          : null
      )


    if (!servicioId) {
      return 0
    }


    return pagos
      .filter(
        pago =>
          Number(
            pago.servicio_id
          ) ===
          Number(
            servicioId
          )
      )
      .reduce(
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
  }


  // ==========================================
  // SERVICIOS REALES / CONCLUIDOS
  // ==========================================

  const totalServiciosReales =
    servicios.filter(
      servicio =>
        servicio
          .tieneServicio
    ).length


  const totalConcluidos =
    servicios.filter(
      servicio =>
        String(
          servicio.estado ||
          ''
        )
          .toUpperCase() ===
        'CONCLUIDO'
    ).length


  // =====================================================
  // FIN PARTE 1
  // PEGAR PARTE 2 EXACTAMENTE DEBAJO DE ESTA LÍNEA
  // =====================================================
    // ==========================================
  // ESTILOS DE FORMULARIOS
  // ==========================================

  const estiloCampo = {
    width: '100%',
    minHeight: '42px',
    border: '1px solid #DDE3EA',
    borderRadius: '10px',
    padding: '9px 11px',
    fontFamily: 'inherit',
    fontSize: '12px',
    color: '#0D1B3D',
    background: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box'
  }


  const estiloTextarea = {
    ...estiloCampo,
    minHeight: '90px',
    resize: 'vertical'
  }


  const estiloLabel = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '9px',
    fontWeight: '800',
    letterSpacing: '.6px',
    color: '#98A1AE'
  }


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (

    <div className="cli-page">


      {/* ======================================
          HEADER
      ====================================== */}

      <header className="cli-header">

        <div>

          <button
            type="button"
            className="cli-back"
            onClick={
              onVolver
            }
          >
            ← Volver al Dashboard
          </button>


          <span className="cli-eyebrow">
            GESTIÓN COMERCIAL
          </span>


          <h1>
            Clientes
          </h1>


          <p>
            Directorio, historial y seguimiento de clientes DESTAPA YA.
          </p>

        </div>


        <div className="cli-brand">
          DY
        </div>

      </header>


      <main className="cli-content">


        {/* ======================================
            KPIs GENERALES
        ====================================== */}

        <section className="cli-kpis">

          <div className="cli-kpi">

            <span>
              Total clientes
            </span>

            <strong>
              {totalClientes}
            </strong>

          </div>


          <div className="cli-kpi">

            <span>
              Clientes activos
            </span>

            <strong>
              {clientesActivos}
            </strong>

          </div>


          <div className="cli-kpi">

            <span>
              Residenciales
            </span>

            <strong>
              {residenciales}
            </strong>

          </div>


          <div className="cli-kpi highlight">

            <span>
              Comerciales
            </span>

            <strong>
              {comerciales}
            </strong>

          </div>

        </section>


        {/* ======================================
            BUSCADOR Y FILTROS
        ====================================== */}

        <section className="cli-filter-card">

          <div className="cli-search">

            <span>
              🔎
            </span>


            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, razón social, RFC..."
              value={
                busqueda
              }
              onChange={
                event =>
                  setBusqueda(
                    event.target.value
                  )
              }
            />

          </div>


          <div className="cli-filter-row">

            <div>

              <label>
                TIPO DE CLIENTE
              </label>


              <select
                value={
                  filtroTipo
                }
                onChange={
                  event =>
                    setFiltroTipo(
                      event.target.value
                    )
                }
              >

                <option value="TODOS">
                  Todos
                </option>

                <option value="RESIDENCIAL">
                  Residencial
                </option>

                <option value="COMERCIAL">
                  Comercial
                </option>

              </select>

            </div>


            <button
              type="button"
              className="cli-refresh"
              onClick={
                cargarClientes
              }
            >
              ↻ Actualizar
            </button>

          </div>

        </section>


        {/* ======================================
            MENSAJE
        ====================================== */}

        {
          mensaje && (

            <div className="cli-error">
              {mensaje}
            </div>

          )
        }


        {/* ======================================
            DIRECTORIO
        ====================================== */}

        <section className="cli-list-card">

          <div className="cli-list-header">

            <div>

              <h2>
                Directorio de clientes
              </h2>


              <p>
                {
                  clientesFiltrados.length
                } resultado(s)
              </p>

            </div>

          </div>


          {
            cargando
              ? (

                <div className="cli-empty">

                  <div>
                    ⏳
                  </div>

                  <h3>
                    Cargando clientes...
                  </h3>

                </div>

              )

              : clientesFiltrados.length ===
                0
                ? (

                  <div className="cli-empty">

                    <div>
                      👥
                    </div>

                    <h3>
                      No encontramos clientes
                    </h3>

                    <p>
                      Modifica los filtros de búsqueda.
                    </p>

                  </div>

                )

                : (

                  <div className="cli-table-wrap">

                    <table className="cli-table">

                      <thead>

                        <tr>

                          <th>
                            CLIENTE
                          </th>

                          <th>
                            TIPO
                          </th>

                          <th>
                            TELÉFONO
                          </th>

                          <th>
                            WHATSAPP
                          </th>

                          <th>
                            ESTADO
                          </th>

                          <th>
                            ACCIONES
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          clientesFiltrados.map(
                            cliente => (

                              <tr
                                key={
                                  cliente.id
                                }
                              >

                                <td>

                                  <strong>
                                    {
                                      cliente.nombre
                                    }
                                  </strong>


                                  {
                                    cliente
                                      .razon_social && (

                                      <span>
                                        {
                                          cliente.razon_social
                                        }
                                      </span>

                                    )
                                  }

                                </td>


                                <td>

                                  <span
                                    className={
                                      `cli-type ${
                                        String(
                                          cliente.tipo_cliente ||
                                          ''
                                        )
                                          .toLowerCase()
                                      }`
                                    }
                                  >
                                    {
                                      cliente.tipo_cliente ||
                                      '—'
                                    }
                                  </span>

                                </td>


                                <td>
                                  {
                                    cliente.telefono ||
                                    '—'
                                  }
                                </td>


                                <td>
                                  {
                                    cliente.whatsapp ||
                                    '—'
                                  }
                                </td>


                                <td>

                                  <span
                                    className={
                                      cliente.activo ===
                                      false
                                        ? 'cli-status inactive'
                                        : 'cli-status active'
                                    }
                                  >

                                    {
                                      cliente.activo ===
                                      false
                                        ? 'INACTIVO'
                                        : 'ACTIVO'
                                    }

                                  </span>

                                </td>


                                <td>

                                  <div className="cli-actions">

                                    <button
                                      type="button"
                                      className="cli-action view"
                                      onClick={() =>
                                        abrirCliente(
                                          cliente
                                        )
                                      }
                                    >
                                      Ver ficha
                                    </button>


                                    <button
                                      type="button"
                                      className="cli-action wa"
                                      onClick={() =>
                                        abrirWhatsApp(
                                          cliente
                                        )
                                      }
                                    >
                                      WhatsApp
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

        </section>

      </main>


      {/* ======================================
          MODAL EXPEDIENTE
      ====================================== */}

      {
        clienteSeleccionado && (

          <div className="cli-modal-overlay">

            <div className="cli-modal">


              {/* ==================================
                  HEADER DEL EXPEDIENTE
              ================================== */}

              <div className="cli-modal-header">

                <div>

                  <span>
                    EXPEDIENTE DEL CLIENTE
                  </span>


                  <h2>
                    {
                      clienteSeleccionado
                        .nombre
                    }
                  </h2>


                  <p>
                    {
                      clienteSeleccionado
                        .tipo_cliente ||
                      'Cliente'
                    }
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    cerrarCliente
                  }
                >
                  ✕
                </button>

              </div>


              <div className="cli-modal-content">


                {
                  cargandoDetalle
                    ? (

                      <div className="cli-detail-card cli-loading">
                        Cargando expediente...
                      </div>

                    )

                    : (

                      <>


                        {/* ==========================
                            KPIs DEL CLIENTE
                        ========================== */}

                        <div
                          className="cli-client-kpis"
                          style={{
                            gridTemplateColumns:
                              'repeat(4, 1fr)'
                          }}
                        >

                          <div>

                            <span>
                              HISTÓRICO
                            </span>

                            <strong>
                              {
                                servicios.length
                              }
                            </strong>

                          </div>


                          <div>

                            <span>
                              SERVICIOS
                            </span>

                            <strong>
                              {
                                totalServiciosReales
                              }
                            </strong>

                          </div>


                          <div>

                            <span>
                              CONCLUIDOS
                            </span>

                            <strong>
                              {
                                totalConcluidos
                              }
                            </strong>

                          </div>


                          <div>

                            <span>
                              TOTAL PAGADO
                            </span>

                            <strong>
                              {
                                formatearMoneda(
                                  totalPagado
                                )
                              }
                            </strong>

                          </div>

                        </div>


                        {/* ==========================
                            DATOS DEL CLIENTE
                        ========================== */}

                        <section className="cli-detail-card">


                          <div
                            style={{
                              display: 'flex',
                              justifyContent:
                                'space-between',
                              alignItems:
                                'center',
                              gap: '12px',
                              marginBottom:
                                '16px'
                            }}
                          >

                            <h3
                              style={{
                                margin: 0
                              }}
                            >
                              Datos del cliente
                            </h3>


                            {
                              !editandoCliente && (

                                <button
                                  type="button"
                                  className="cli-refresh"
                                  onClick={
                                    iniciarEdicionCliente
                                  }
                                >
                                  ✎ Editar cliente
                                </button>

                              )
                            }

                          </div>


                          {
                            editandoCliente
                              ? (

                                <>
                                  {/* ====================
                                      FORMULARIO CLIENTE
                                  ==================== */}

                                  <div className="cli-detail-grid">


                                    <div>

                                      <label
                                        style={
                                          estiloLabel
                                        }
                                      >
                                        NOMBRE *
                                      </label>


                                      <input
                                        type="text"
                                        style={
                                          estiloCampo
                                        }
                                        value={
                                          formularioCliente
                                            .nombre
                                        }
                                        onChange={
                                          event =>
                                            cambiarCliente(
                                              'nombre',
                                              event
                                                .target
                                                .value
                                            )
                                        }
                                      />

                                    </div>


                                    <div>

                                      <label
                                        style={
                                          estiloLabel
                                        }
                                      >
                                        TIPO DE CLIENTE
                                      </label>


                                      <select
                                        style={
                                          estiloCampo
                                        }
                                        value={
                                          formularioCliente
                                            .tipo_cliente
                                        }
                                        onChange={
                                          event =>
                                            cambiarCliente(
                                              'tipo_cliente',
                                              event
                                                .target
                                                .value
                                            )
                                        }
                                      >

                                        <option value="RESIDENCIAL">
                                          Residencial
                                        </option>

                                        <option value="COMERCIAL">
                                          Comercial
                                        </option>

                                      </select>

                                    </div>


                                    <div>

                                      <label
                                        style={
                                          estiloLabel
                                        }
                                      >
                                        TELÉFONO *
                                      </label>


                                      <input
                                        type="tel"
                                        style={
                                          estiloCampo
                                        }
                                        value={
                                          formularioCliente
                                            .telefono
                                        }
                                        onChange={
                                          event =>
                                            cambiarCliente(
                                              'telefono',
                                              event
                                                .target
                                                .value
                                            )
                                        }
                                      />

                                    </div>


                                    <div>

                                      <label
                                        style={
                                          estiloLabel
                                        }
                                      >
                                        WHATSAPP
                                      </label>


                                      <input
                                        type="tel"
                                        style={
                                          estiloCampo
                                        }
                                        value={
                                          formularioCliente
                                            .whatsapp
                                        }
                                        onChange={
                                          event =>
                                            cambiarCliente(
                                              'whatsapp',
                                              event
                                                .target
                                                .value
                                            )
                                        }
                                      />

                                    </div>


                                    <div>

                                      <label
                                        style={
                                          estiloLabel
                                        }
                                      >
                                        RAZÓN SOCIAL
                                      </label>


                                      <input
                                        type="text"
                                        style={
                                          estiloCampo
                                        }
                                        value={
                                          formularioCliente
                                            .razon_social
                                        }
                                        onChange={
                                          event =>
                                            cambiarCliente(
                                              'razon_social',
                                              event
                                                .target
                                                .value
                                            )
                                        }
                                      />

                                    </div>


                                    <div>

                                      <label
                                        style={
                                          estiloLabel
                                        }
                                      >
                                        RFC
                                      </label>


                                      <input
                                        type="text"
                                        style={
                                          estiloCampo
                                        }
                                        value={
                                          formularioCliente
                                            .rfc
                                        }
                                        onChange={
                                          event =>
                                            cambiarCliente(
                                              'rfc',
                                              event
                                                .target
                                                .value
                                            )
                                        }
                                      />

                                    </div>


                                    <div>

                                      <label
                                        style={
                                          estiloLabel
                                        }
                                      >
                                        CONTACTO ADMINISTRATIVO
                                      </label>


                                      <input
                                        type="text"
                                        style={
                                          estiloCampo
                                        }
                                        value={
                                          formularioCliente
                                            .contacto_administrativo
                                        }
                                        onChange={
                                          event =>
                                            cambiarCliente(
                                              'contacto_administrativo',
                                              event
                                                .target
                                                .value
                                            )
                                        }
                                      />

                                    </div>


                                    <div>

                                      <label
                                        style={
                                          estiloLabel
                                        }
                                      >
                                        TELÉFONO CONTACTO
                                      </label>


                                      <input
                                        type="tel"
                                        style={
                                          estiloCampo
                                        }
                                        value={
                                          formularioCliente
                                            .telefono_contacto
                                        }
                                        onChange={
                                          event =>
                                            cambiarCliente(
                                              'telefono_contacto',
                                              event
                                                .target
                                                .value
                                            )
                                        }
                                      />

                                    </div>


                                    <div className="full">

                                      <label
                                        style={
                                          estiloLabel
                                        }
                                      >
                                        CORREO ADMINISTRATIVO
                                      </label>


                                      <input
                                        type="email"
                                        style={
                                          estiloCampo
                                        }
                                        value={
                                          formularioCliente
                                            .correo_administrativo
                                        }
                                        onChange={
                                          event =>
                                            cambiarCliente(
                                              'correo_administrativo',
                                              event
                                                .target
                                                .value
                                            )
                                        }
                                      />

                                    </div>


                                    <div className="full">

                                      <label
                                        style={
                                          estiloLabel
                                        }
                                      >
                                        NOTAS
                                      </label>


                                      <textarea
                                        style={
                                          estiloTextarea
                                        }
                                        value={
                                          formularioCliente
                                            .notas
                                        }
                                        onChange={
                                          event =>
                                            cambiarCliente(
                                              'notas',
                                              event
                                                .target
                                                .value
                                            )
                                        }
                                      />

                                    </div>


                                    <div className="full">

                                      <label
                                        style={{
                                          display:
                                            'flex',
                                          alignItems:
                                            'center',
                                          gap:
                                            '9px',
                                          cursor:
                                            'pointer',
                                          fontWeight:
                                            '700',
                                          fontSize:
                                            '12px'
                                        }}
                                      >

                                        <input
                                          type="checkbox"
                                          checked={
                                            formularioCliente
                                              .activo
                                          }
                                          onChange={
                                            event =>
                                              cambiarCliente(
                                                'activo',
                                                event
                                                  .target
                                                  .checked
                                              )
                                          }
                                        />

                                        Cliente activo

                                      </label>

                                    </div>

                                  </div>


                                  <div className="cli-contact-actions">

                                    <button
                                      type="button"
                                      onClick={
                                        cancelarEdicionCliente
                                      }
                                      disabled={
                                        guardandoCliente
                                      }
                                    >
                                      Cancelar
                                    </button>


                                    <button
                                      type="button"
                                      className="primary"
                                      onClick={
                                        guardarCliente
                                      }
                                      disabled={
                                        guardandoCliente
                                      }
                                    >
                                      {
                                        guardandoCliente
                                          ? 'Guardando...'
                                          : '✓ Guardar cambios'
                                      }
                                    </button>

                                  </div>

                                </>

                              )

                              : (

                                <>
                                  {/* ====================
                                      DATOS SOLO LECTURA
                                  ==================== */}

                                  <div className="cli-detail-grid">

                                    <div>

                                      <span>
                                        TELÉFONO
                                      </span>

                                      <strong>
                                        {
                                          clienteSeleccionado
                                            .telefono ||
                                          '—'
                                        }
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        WHATSAPP
                                      </span>

                                      <strong>
                                        {
                                          clienteSeleccionado
                                            .whatsapp ||
                                          '—'
                                        }
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        RAZÓN SOCIAL
                                      </span>

                                      <strong>
                                        {
                                          clienteSeleccionado
                                            .razon_social ||
                                          '—'
                                        }
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        RFC
                                      </span>

                                      <strong>
                                        {
                                          clienteSeleccionado
                                            .rfc ||
                                          '—'
                                        }
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        CONTACTO ADMINISTRATIVO
                                      </span>

                                      <strong>
                                        {
                                          clienteSeleccionado
                                            .contacto_administrativo ||
                                          '—'
                                        }
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        TELÉFONO CONTACTO
                                      </span>

                                      <strong>
                                        {
                                          clienteSeleccionado
                                            .telefono_contacto ||
                                          '—'
                                        }
                                      </strong>

                                    </div>


                                    <div className="full">

                                      <span>
                                        CORREO ADMINISTRATIVO
                                      </span>

                                      <strong>
                                        {
                                          clienteSeleccionado
                                            .correo_administrativo ||
                                          '—'
                                        }
                                      </strong>

                                    </div>


                                    <div className="full">

                                      <span>
                                        NOTAS
                                      </span>

                                      <strong>
                                        {
                                          clienteSeleccionado
                                            .notas ||
                                          'Sin notas.'
                                        }
                                      </strong>

                                    </div>

                                  </div>


                                  <div className="cli-contact-actions">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirWhatsApp(
                                          clienteSeleccionado
                                        )
                                      }
                                    >
                                      WhatsApp
                                    </button>


                                    <button
                                      type="button"
                                      onClick={() =>
                                        llamar(
                                          clienteSeleccionado
                                        )
                                      }
                                    >
                                      Llamar
                                    </button>


                                    {
                                      onNuevaCitaCliente && (

                                        <button
                                          type="button"
                                          className="primary"
                                          onClick={() =>
                                            onNuevaCitaCliente(
                                              clienteSeleccionado
                                            )
                                          }
                                        >
                                          + Nueva cita
                                        </button>

                                      )
                                    }

                                  </div>

                                </>

                              )
                          }

                        </section>


                        {/* ==========================
                            DIRECCIONES
                        ========================== */}

                        <section className="cli-detail-card">

                          <div
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              alignItems:
                                'center',
                              gap:
                                '12px',
                              marginBottom:
                                '15px'
                            }}
                          >

                            <div>

                              <h3
                                style={{
                                  margin:
                                    '0 0 3px'
                                }}
                              >
                                Direcciones
                              </h3>


                              <span
                                style={{
                                  fontSize:
                                    '10px',
                                  color:
                                    '#98A1AE'
                                }}
                              >
                                {
                                  direcciones.length
                                } dirección(es)
                              </span>

                            </div>


                            {
                              !mostrandoFormularioDireccion && (

                                <button
                                  type="button"
                                  className="cli-action view"
                                  onClick={
                                    nuevaDireccion
                                  }
                                >
                                  + Nueva dirección
                                </button>

                              )
                            }

                          </div>


                          {/* ========================
                              FORMULARIO DIRECCIÓN
                          ======================== */}

                          {
                            mostrandoFormularioDireccion && (

                              <div
                                style={{
                                  background:
                                    '#F8FAFC',
                                  border:
                                    '1px solid #E5EAF0',
                                  borderRadius:
                                    '14px',
                                  padding:
                                    '16px',
                                  marginBottom:
                                    '16px'
                                }}
                              >

                                <h4
                                  style={{
                                    margin:
                                      '0 0 16px',
                                    color:
                                      '#0D1B3D'
                                  }}
                                >
                                  {
                                    direccionEditando
                                      ? 'Editar dirección'
                                      : 'Nueva dirección'
                                  }
                                </h4>


                                <div className="cli-detail-grid">


                                  <div>

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      NOMBRE DE UBICACIÓN
                                    </label>


                                    <input
                                      type="text"
                                      placeholder="Ej. Casa, Oficina, Sucursal Centro"
                                      style={
                                        estiloCampo
                                      }
                                      value={
                                        formularioDireccion
                                          .nombre_ubicacion
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'nombre_ubicacion',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div>

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      CALLE *
                                    </label>


                                    <input
                                      type="text"
                                      style={
                                        estiloCampo
                                      }
                                      value={
                                        formularioDireccion
                                          .calle
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'calle',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div>

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      NÚMERO EXTERIOR *
                                    </label>


                                    <input
                                      type="text"
                                      style={
                                        estiloCampo
                                      }
                                      value={
                                        formularioDireccion
                                          .numero_exterior
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'numero_exterior',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div>

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      NÚMERO INTERIOR
                                    </label>


                                    <input
                                      type="text"
                                      style={
                                        estiloCampo
                                      }
                                      value={
                                        formularioDireccion
                                          .numero_interior
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'numero_interior',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div>

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      COLONIA *
                                    </label>


                                    <input
                                      type="text"
                                      style={
                                        estiloCampo
                                      }
                                      value={
                                        formularioDireccion
                                          .colonia
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'colonia',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div>

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      MUNICIPIO *
                                    </label>


                                    <input
                                      type="text"
                                      style={
                                        estiloCampo
                                      }
                                      value={
                                        formularioDireccion
                                          .municipio
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'municipio',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div>

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      ESTADO
                                    </label>


                                    <input
                                      type="text"
                                      style={
                                        estiloCampo
                                      }
                                      value={
                                        formularioDireccion
                                          .estado
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'estado',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div>

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      CÓDIGO POSTAL
                                    </label>


                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      maxLength="5"
                                      style={
                                        estiloCampo
                                      }
                                      value={
                                        formularioDireccion
                                          .codigo_postal
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'codigo_postal',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div>

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      LATITUD
                                    </label>


                                    <input
                                      type="number"
                                      step="any"
                                      style={
                                        estiloCampo
                                      }
                                      value={
                                        formularioDireccion
                                          .latitud
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'latitud',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div>

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      LONGITUD
                                    </label>


                                    <input
                                      type="number"
                                      step="any"
                                      style={
                                        estiloCampo
                                      }
                                      value={
                                        formularioDireccion
                                          .longitud
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'longitud',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div className="full">

                                    <label
                                      style={
                                        estiloLabel
                                      }
                                    >
                                      REFERENCIAS
                                    </label>


                                    <textarea
                                      style={
                                        estiloTextarea
                                      }
                                      placeholder="Ej. Casa azul frente al parque..."
                                      value={
                                        formularioDireccion
                                          .referencias
                                      }
                                      onChange={
                                        event =>
                                          cambiarDireccion(
                                            'referencias',
                                            event
                                              .target
                                              .value
                                          )
                                      }
                                    />

                                  </div>


                                  <div className="full">

                                    <label
                                      style={{
                                        display:
                                          'flex',
                                        alignItems:
                                          'center',
                                        gap:
                                          '9px',
                                        cursor:
                                          'pointer',
                                        fontSize:
                                          '12px',
                                        fontWeight:
                                          '700'
                                      }}
                                    >

                                      <input
                                        type="checkbox"
                                        checked={
                                          formularioDireccion
                                            .es_principal
                                        }
                                        onChange={
                                          event =>
                                            cambiarDireccion(
                                              'es_principal',
                                              event
                                                .target
                                                .checked
                                            )
                                        }
                                      />

                                      Marcar como dirección principal

                                    </label>

                                  </div>

                                </div>


                                <div className="cli-contact-actions">

                                  <button
                                    type="button"
                                    onClick={
                                      cancelarDireccion
                                    }
                                    disabled={
                                      guardandoDireccion
                                    }
                                  >
                                    Cancelar
                                  </button>


                                  <button
                                    type="button"
                                    className="primary"
                                    onClick={
                                      guardarDireccion
                                    }
                                    disabled={
                                      guardandoDireccion
                                    }
                                  >
                                    {
                                      guardandoDireccion
                                        ? 'Guardando...'
                                        : direccionEditando
                                          ? '✓ Actualizar dirección'
                                          : '✓ Guardar dirección'
                                    }
                                  </button>

                                </div>

                              </div>

                            )
                          }


                          {/* ========================
                              LISTADO DIRECCIONES
                          ======================== */}

                          {
                            direcciones.length ===
                            0
                              ? (

                                <p className="cli-muted">
                                  No hay direcciones registradas para este cliente.
                                </p>

                              )

                              : (

                                <div className="cli-address-list">

                                  {
                                    direcciones.map(
                                      direccion => (

                                        <div
                                          key={
                                            direccion.id
                                          }
                                          className="cli-address"
                                        >

                                          <div
                                            style={{
                                              display:
                                                'flex',
                                              justifyContent:
                                                'space-between',
                                              alignItems:
                                                'flex-start',
                                              gap:
                                                '12px'
                                            }}
                                          >

                                            <div>

                                              <div
                                                style={{
                                                  display:
                                                    'flex',
                                                  alignItems:
                                                    'center',
                                                  gap:
                                                    '8px',
                                                  flexWrap:
                                                    'wrap'
                                                }}
                                              >

                                                <strong>
                                                  {
                                                    direccion
                                                      .nombre_ubicacion ||
                                                    'Dirección'
                                                  }
                                                </strong>


                                                {
                                                  direccion
                                                    .es_principal && (

                                                    <span className="cli-principal">
                                                      PRINCIPAL
                                                    </span>

                                                  )
                                                }

                                              </div>


                                              <p>
                                                {
                                                  obtenerDireccion(
                                                    direccion
                                                  )
                                                }
                                              </p>


                                              {
                                                direccion
                                                  .referencias && (

                                                  <small>
                                                    Ref.: {
                                                      direccion
                                                        .referencias
                                                    }
                                                  </small>

                                                )
                                              }

                                            </div>


                                            <button
                                              type="button"
                                              className="cli-refresh"
                                              onClick={() =>
                                                editarDireccion(
                                                  direccion
                                                )
                                              }
                                            >
                                              ✎ Editar
                                            </button>

                                          </div>

                                        </div>

                                      )
                                    )
                                  }

                                </div>

                              )
                          }

                        </section>


                        {/* ==========================
                            HISTORIAL
                        ========================== */}

                        <section className="cli-detail-card">

                          <h3>
                            Historial de servicios
                          </h3>


                          {
                            servicios.length ===
                            0
                              ? (

                                <p className="cli-muted">
                                  Este cliente todavía no tiene citas registradas.
                                </p>

                              )

                              : (

                                <div className="cli-history">

                                  {
                                    servicios.map(
                                      servicio => (

                                        <article
                                          key={
                                            servicio.id
                                          }
                                          className="cli-history-item"
                        
                                        >
                                            {
  servicio.tieneServicio &&
  onVerServicio && (

    <div
      className="cli-contact-actions"
      style={{
        marginTop: '14px'
      }}
    >

      <button
        type="button"
        className="primary"
        onClick={() =>
          onVerServicio(
            servicio
          )
        }
      >
        🔧 Ver servicio completo
      </button>

    </div>

  )
}

                                          <div className="cli-history-main">

                                            <div>

                                              <strong className="cli-folio">
                                                {
                                                  servicio.folio
                                                }
                                              </strong>


                                              <span>
                                                {
                                                  servicio
                                                    ?.citas
                                                    ?.tipos_servicio
                                                    ?.nombre ||
                                                  'Servicio'
                                                }
                                              </span>

                                            </div>


                                            <span
                                              className={
                                                `cli-service-status ${
                                                  String(
                                                    servicio.estado ||
                                                    ''
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
                                                String(
                                                  servicio.estado ||
                                                  '—'
                                                )
                                                  .replaceAll(
                                                    '_',
                                                    ' '
                                                  )
                                              }
                                            </span>

                                          </div>


                                          <div className="cli-history-data">

                                            <div>

                                              <span>
                                                FECHA
                                              </span>

                                              <strong>
                                                {
                                                  formatearFecha(
                                                    servicio
                                                      ?.citas
                                                      ?.fecha ||
                                                    servicio
                                                      .fecha_inicio
                                                  )
                                                }
                                              </strong>

                                            </div>


                                            <div>

                                              <span>
                                                IMPORTE
                                              </span>

                                              <strong>
                                                {
                                                  formatearMoneda(
                                                    obtenerPagoServicio(
                                                      servicio
                                                    )
                                                  )
                                                }
                                              </strong>

                                            </div>


                                            <div className="wide">

                                              <span>
                                                PROBLEMA REPORTADO
                                              </span>

                                              <strong>
                                                {
                                                  servicio
                                                    ?.citas
                                                    ?.descripcion_problema ||
                                                  '—'
                                                }
                                              </strong>

                                            </div>

                                          </div>


                                          {
                                            servicio
                                              .diagnostico && (

                                              <div className="cli-history-data">

                                                <div className="wide">

                                                  <span>
                                                    DIAGNÓSTICO
                                                  </span>

                                                  <strong>
                                                    {
                                                      servicio
                                                        .diagnostico
                                                    }
                                                  </strong>

                                                </div>

                                              </div>

                                            )
                                          }


                                          {
                                            servicio
                                              .trabajo_realizado && (

                                              <div className="cli-history-data">

                                                <div className="wide">

                                                  <span>
                                                    TRABAJO REALIZADO
                                                  </span>

                                                  <strong>
                                                    {
                                                      servicio
                                                        .trabajo_realizado
                                                    }
                                                  </strong>

                                                </div>

                                              </div>

                                            )
                                          }
                                          {
  servicio.tieneServicio &&
  onVerServicio && (

    <div
      style={{
        marginTop: '16px',
        paddingTop: '14px',
        borderTop: '1px solid #E5EAF0',
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >

      <button
        type="button"
        className="cli-action view"
        onClick={() => {

          onVerServicio(
            servicio
          )

        }}
        style={{
          padding: '11px 16px',
          fontSize: '11px'
        }}
      >
        🔧 Ver servicio completo
      </button>

    </div>

  )
}

                                          {
                                            servicio
                                              .recomendaciones && (

                                              <div className="cli-history-data">

                                                <div className="wide">

                                                  <span>
                                                    RECOMENDACIONES
                                                  </span>

                                                  <strong>
                                                    {
                                                      servicio
                                                        .recomendaciones
                                                    }
                                                  </strong>

                                                </div>

                                              </div>

                                            )
                                          }

                                        </article>

                                      )
                                    )
                                  }

                                </div>

                              )
                          }

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


export default Clientes