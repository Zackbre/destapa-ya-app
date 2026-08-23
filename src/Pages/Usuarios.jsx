import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { supabase } from '../supabase'
import './Usuarios.css'


const ROLES = [
  {
    value: 'ADMINISTRADOR',
    label: 'Administrador'
  },
  {
    value: 'TECNICO',
    label: 'Técnico'
  }
]


function formularioVacio() {
  return {
    nombre: '',
    email: '',
    telefono: '',
    rol: 'TECNICO',
    password: ''
  }
}


function Usuarios({
  perfil,
  onVolver
}) {

  const [usuarios, setUsuarios] =
    useState([])

  const [cargando, setCargando] =
    useState(true)

  const [procesando, setProcesando] =
    useState(false)

  const [mensaje, setMensaje] =
    useState('')

  const [busqueda, setBusqueda] =
    useState('')

  const [filtroRol, setFiltroRol] =
    useState('TODOS')

  const [filtroEstado, setFiltroEstado] =
    useState('TODOS')

  const [
    mostrandoFormulario,
    setMostrandoFormulario
  ] = useState(false)

  const [
    usuarioEditando,
    setUsuarioEditando
  ] = useState(null)

  const [formulario, setFormulario] =
    useState(formularioVacio())

  const [
    usuarioPassword,
    setUsuarioPassword
  ] = useState(null)

  const [
    nuevaPassword,
    setNuevaPassword
  ] = useState('')

  const [
    confirmarPassword,
    setConfirmarPassword
  ] = useState('')


  useEffect(() => {

    if (
      perfil
        ?.roles
        ?.nombre !==
      'ADMINISTRADOR'
    ) {

      setMensaje(
        'Este módulo es exclusivo para administradores.'
      )

      setCargando(false)

      return
    }


    cargarUsuarios()

  }, [])


  // ==========================================
  // EDGE FUNCTION
  // ==========================================

  async function ejecutarAccion(
    body
  ) {

    const {
      data,
      error
    } =
      await supabase
        .functions
        .invoke(
          'administrar-usuarios',
          {
            body
          }
        )


    if (error) {

      let detalle =
        error.message ||
        'Error ejecutando la operación.'


      try {

        const contexto =
          error.context

        if (
          contexto &&
          typeof contexto.json ===
          'function'
        ) {

          const json =
            await contexto.json()

          if (
            json?.error
          ) {
            detalle =
              json.error
          }
        }

      } catch {
        // conservar mensaje original
      }


      throw new Error(
        detalle
      )
    }


    if (
      data?.error
    ) {
      throw new Error(
        data.error
      )
    }


    return data
  }


  // ==========================================
  // CARGAR USUARIOS
  // ==========================================

  async function cargarUsuarios() {

    setCargando(true)
    setMensaje('')


    try {

      const resultado =
        await ejecutarAccion({
          accion:
            'listar'
        })


      setUsuarios(
        resultado
          ?.usuarios ||
        []
      )

    } catch (error) {

      console.error(
        'Error cargando usuarios:',
        error
      )


      setMensaje(
        'No fue posible cargar los usuarios: ' +
        error.message
      )

      setUsuarios([])

    } finally {
      setCargando(false)
    }
  }


  // ==========================================
  // FORMATO
  // ==========================================

  function formatearFecha(
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


  function rolLabel(
    valor
  ) {

    return (
      ROLES.find(
        item =>
          item.value ===
          valor
      )?.label ||
      valor ||
      'Sin rol'
    )
  }


  // ==========================================
  // KPI
  // ==========================================

  const kpis =
    useMemo(
      () => {

        const activos =
          usuarios.filter(
            usuario =>
              usuario.activo !==
              false
          )

        const administradores =
          usuarios.filter(
            usuario =>
              usuario.rol ===
              'ADMINISTRADOR'
          ).length

        const tecnicos =
          usuarios.filter(
            usuario =>
              usuario.rol ===
              'TECNICO'
          ).length

        const inactivos =
          usuarios.filter(
            usuario =>
              usuario.activo ===
              false
          ).length


        return {
          total:
            usuarios.length,
          activos:
            activos.length,
          administradores,
          tecnicos,
          inactivos
        }
      },
      [usuarios]
    )


  // ==========================================
  // FILTROS
  // ==========================================

  const usuariosFiltrados =
    useMemo(
      () => {

        const texto =
          busqueda
            .trim()
            .toLowerCase()


        return usuarios.filter(
          usuario => {

            const coincideTexto =
              !texto ||
              [
                usuario.nombre,
                usuario.email,
                usuario.telefono
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(texto)


            const coincideRol =
              filtroRol ===
                'TODOS' ||
              usuario.rol ===
                filtroRol


            const coincideEstado =
              filtroEstado ===
                'TODOS' ||
              (
                filtroEstado ===
                  'ACTIVOS' &&
                usuario.activo !==
                  false
              ) ||
              (
                filtroEstado ===
                  'INACTIVOS' &&
                usuario.activo ===
                  false
              )


            return (
              coincideTexto &&
              coincideRol &&
              coincideEstado
            )
          }
        )
      },
      [
        usuarios,
        busqueda,
        filtroRol,
        filtroEstado
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


  function nuevoUsuario() {

    setUsuarioEditando(
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


  function editarUsuario(
    usuario
  ) {

    setUsuarioEditando(
      usuario
    )

    setFormulario({
      nombre:
        usuario.nombre ||
        '',
      email:
        usuario.email ||
        '',
      telefono:
        usuario.telefono ||
        '',
      rol:
        usuario.rol ||
        'TECNICO',
      password:
        ''
    })

    setMostrandoFormulario(
      true
    )

    setMensaje('')
  }


  function cerrarFormulario() {

    if (procesando) {
      return
    }

    setMostrandoFormulario(
      false
    )

    setUsuarioEditando(
      null
    )

    setFormulario(
      formularioVacio()
    )
  }


  async function guardarUsuario(
    evento
  ) {

    evento.preventDefault()


    if (
      !formulario
        .nombre
        .trim()
    ) {

      window.alert(
        'Escribe el nombre del usuario.'
      )

      return
    }


    if (
      !usuarioEditando &&
      !formulario
        .email
        .trim()
    ) {

      window.alert(
        'Escribe el correo electrónico.'
      )

      return
    }


    if (
      !usuarioEditando &&
      formulario.password
        .length < 8
    ) {

      window.alert(
        'La contraseña temporal debe tener al menos 8 caracteres.'
      )

      return
    }


    setProcesando(true)
    setMensaje('')


    try {

      if (
        usuarioEditando
      ) {

        await ejecutarAccion({
          accion:
            'actualizar',

          usuarioId:
            usuarioEditando.id,

          nombre:
            formulario
              .nombre
              .trim(),

          telefono:
            formulario
              .telefono
              .trim(),

          rol:
            formulario.rol
        })


        window.alert(
          'Usuario actualizado correctamente.'
        )

      } else {

        await ejecutarAccion({
          accion:
            'crear',

          nombre:
            formulario
              .nombre
              .trim(),

          email:
            formulario
              .email
              .trim()
              .toLowerCase(),

          telefono:
            formulario
              .telefono
              .trim(),

          rol:
            formulario.rol,

          password:
            formulario.password
        })


        window.alert(
          'Usuario creado correctamente.\n\n' +
          'Ya puede iniciar sesión con el correo y la contraseña temporal que registraste.'
        )
      }


      setMostrandoFormulario(
        false
      )

      setUsuarioEditando(
        null
      )

      setFormulario(
        formularioVacio()
      )


      await cargarUsuarios()

    } catch (error) {

      console.error(
        'Error guardando usuario:',
        error
      )


      setMensaje(
        'No fue posible guardar el usuario: ' +
        error.message
      )

    } finally {
      setProcesando(false)
    }
  }


  // ==========================================
  // ACTIVAR / DESACTIVAR
  // ==========================================

  async function cambiarEstado(
    usuario
  ) {

    const activar =
      usuario.activo ===
      false


    if (
      !activar &&
      String(
        usuario.id
      ) ===
      String(
        perfil?.id
      )
    ) {

      window.alert(
        'No puedes desactivar tu propia cuenta mientras estás conectado.'
      )

      return
    }


    const confirmar =
      window.confirm(
        activar
          ? `¿Reactivar a ${usuario.nombre}? Podrá volver a iniciar sesión.`
          : `¿Desactivar a ${usuario.nombre}? No podrá iniciar sesión, pero su historial permanecerá intacto.`
      )


    if (!confirmar) {
      return
    }


    setProcesando(true)
    setMensaje('')


    try {

      await ejecutarAccion({
        accion:
          'estado',

        usuarioId:
          usuario.id,

        activo:
          activar
      })


      await cargarUsuarios()

    } catch (error) {

      console.error(
        'Error cambiando estado:',
        error
      )


      setMensaje(
        'No fue posible cambiar el estado del usuario: ' +
        error.message
      )

    } finally {
      setProcesando(false)
    }
  }


  // ==========================================
  // CONTRASEÑA
  // ==========================================

  function abrirPassword(
    usuario
  ) {

    setUsuarioPassword(
      usuario
    )

    setNuevaPassword('')
    setConfirmarPassword('')
    setMensaje('')
  }


  function cerrarPassword() {

    if (procesando) {
      return
    }

    setUsuarioPassword(null)
    setNuevaPassword('')
    setConfirmarPassword('')
  }


  async function guardarPassword(
    evento
  ) {

    evento.preventDefault()


    if (
      !usuarioPassword
    ) {
      return
    }


    if (
      nuevaPassword.length <
      8
    ) {

      window.alert(
        'La nueva contraseña debe tener al menos 8 caracteres.'
      )

      return
    }


    if (
      nuevaPassword !==
      confirmarPassword
    ) {

      window.alert(
        'Las contraseñas no coinciden.'
      )

      return
    }


    setProcesando(true)
    setMensaje('')


    try {

      await ejecutarAccion({
        accion:
          'password',

        usuarioId:
          usuarioPassword.id,

        password:
          nuevaPassword
      })


      window.alert(
        'Contraseña actualizada correctamente.'
      )


      setUsuarioPassword(null)
      setNuevaPassword('')
      setConfirmarPassword('')

    } catch (error) {

      console.error(
        'Error restableciendo contraseña:',
        error
      )


      setMensaje(
        'No fue posible restablecer la contraseña: ' +
        error.message
      )

    } finally {
      setProcesando(false)
    }
  }


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="usr-page">

      <header className="usr-header">

        <div>

          <button
            type="button"
            className="usr-back"
            onClick={
              onVolver
            }
          >
            ← Volver al Dashboard
          </button>

          <span className="usr-eyebrow">
            SEGURIDAD Y ACCESO
          </span>

          <h1>
            Usuarios
          </h1>

          <p>
            Administra quién puede ingresar a DESTAPA YA y define su nivel de acceso.
          </p>

        </div>


        <button
          type="button"
          className="usr-new-button"
          onClick={
            nuevoUsuario
          }
          disabled={
            perfil
              ?.roles
              ?.nombre !==
            'ADMINISTRADOR'
          }
        >
          ＋ Nuevo usuario
        </button>

      </header>


      <main className="usr-content">

        {
          mensaje && (
            <div className="usr-message">
              {mensaje}
            </div>
          )
        }


        <section className="usr-kpis">

          <article className="usr-kpi usr-kpi-main">

            <span>
              Usuarios
            </span>

            <strong>
              {kpis.total}
            </strong>

            <small>
              Cuentas registradas
            </small>

          </article>


          <article className="usr-kpi">

            <span>
              Activos
            </span>

            <strong>
              {kpis.activos}
            </strong>

            <small>
              Con acceso permitido
            </small>

          </article>


          <article className="usr-kpi">

            <span>
              Administradores
            </span>

            <strong>
              {kpis.administradores}
            </strong>

            <small>
              Acceso administrativo
            </small>

          </article>


          <article className="usr-kpi">

            <span>
              Técnicos
            </span>

            <strong>
              {kpis.tecnicos}
            </strong>

            <small>
              Acceso operativo
            </small>

          </article>


          <article className="usr-kpi">

            <span>
              Inactivos
            </span>

            <strong>
              {kpis.inactivos}
            </strong>

            <small>
              Acceso bloqueado
            </small>

          </article>

        </section>


        <section className="usr-toolbar">

          <label className="usr-search">

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
              placeholder="Nombre, correo o teléfono..."
            />

          </label>


          <label>

            <span>
              Rol
            </span>

            <select
              value={
                filtroRol
              }
              onChange={
                evento =>
                  setFiltroRol(
                    evento.target.value
                  )
              }
            >

              <option value="TODOS">
                Todos
              </option>

              {
                ROLES.map(
                  rol => (
                    <option
                      key={
                        rol.value
                      }
                      value={
                        rol.value
                      }
                    >
                      {rol.label}
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

              <option value="ACTIVOS">
                Activos
              </option>

              <option value="INACTIVOS">
                Inactivos
              </option>

            </select>

          </label>


          <button
            type="button"
            className="usr-refresh"
            onClick={
              cargarUsuarios
            }
          >
            ↻ Actualizar
          </button>

        </section>


        <section className="usr-list-card">

          <div className="usr-list-header">

            <div>

              <h2>
                Accesos del sistema
              </h2>

              <p>
                {
                  usuariosFiltrados
                    .length
                } usuario(s)
              </p>

            </div>

          </div>


          {
            cargando
              ? (
                <div className="usr-empty">
                  Cargando usuarios...
                </div>
              )
              : usuariosFiltrados
                  .length === 0
                ? (
                  <div className="usr-empty">

                    <div>
                      👥
                    </div>

                    <h3>
                      Sin usuarios
                    </h3>

                    <p>
                      Crea una cuenta o cambia los filtros.
                    </p>

                  </div>
                )
                : (
                  <div className="usr-table-wrap">

                    <table className="usr-table">

                      <thead>

                        <tr>

                          <th>
                            Usuario
                          </th>

                          <th>
                            Rol
                          </th>

                          <th>
                            Estado
                          </th>

                          <th>
                            Último acceso
                          </th>

                          <th>
                            Alta
                          </th>

                          <th>
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          usuariosFiltrados.map(
                            usuario => {

                              const esActual =
                                String(
                                  usuario.id
                                ) ===
                                String(
                                  perfil?.id
                                )


                              return (
                                <tr
                                  key={
                                    usuario.id
                                  }
                                >

                                  <td>

                                    <div className="usr-person">

                                      <div className="usr-avatar">
                                        {
                                          usuario
                                            .nombre
                                            ?.charAt(0)
                                            ?.toUpperCase() ||
                                          'U'
                                        }
                                      </div>


                                      <div>

                                        <strong>

                                          {
                                            usuario.nombre ||
                                            'Sin nombre'
                                          }

                                          {
                                            esActual && (
                                              <span className="usr-you">
                                                Tú
                                              </span>
                                            )
                                          }

                                        </strong>

                                        <span>
                                          {
                                            usuario.email ||
                                            'Sin correo'
                                          }
                                        </span>

                                        {
                                          usuario.telefono && (
                                            <small>
                                              {
                                                usuario.telefono
                                              }
                                            </small>
                                          )
                                        }

                                      </div>

                                    </div>

                                  </td>


                                  <td>

                                    <span
                                      className={
                                        `usr-role ${
                                          usuario.rol ===
                                            'ADMINISTRADOR'
                                            ? 'admin'
                                            : 'tech'
                                        }`
                                      }
                                    >
                                      {
                                        rolLabel(
                                          usuario.rol
                                        )
                                      }
                                    </span>

                                  </td>


                                  <td>

                                    <span
                                      className={
                                        `usr-status ${
                                          usuario.activo ===
                                            false
                                            ? 'inactive'
                                            : 'active'
                                        }`
                                      }
                                    >
                                      {
                                        usuario.activo ===
                                          false
                                          ? 'INACTIVO'
                                          : 'ACTIVO'
                                      }
                                    </span>

                                  </td>


                                  <td>
                                    {
                                      formatearFecha(
                                        usuario
                                          .last_sign_in_at
                                      )
                                    }
                                  </td>


                                  <td>
                                    {
                                      formatearFecha(
                                        usuario
                                          .created_at
                                      )
                                    }
                                  </td>


                                  <td>

                                    <div className="usr-actions">

                                      <button
                                        type="button"
                                        onClick={() =>
                                          editarUsuario(
                                            usuario
                                          )
                                        }
                                      >
                                        Editar
                                      </button>


                                      <button
                                        type="button"
                                        onClick={() =>
                                          abrirPassword(
                                            usuario
                                          )
                                        }
                                      >
                                        Contraseña
                                      </button>


                                      <button
                                        type="button"
                                        className={
                                          usuario.activo ===
                                            false
                                            ? 'activate'
                                            : 'danger'
                                        }
                                        disabled={
                                          esActual &&
                                          usuario.activo !==
                                            false
                                        }
                                        title={
                                          esActual
                                            ? 'No puedes desactivar tu propia cuenta'
                                            : ''
                                        }
                                        onClick={() =>
                                          cambiarEstado(
                                            usuario
                                          )
                                        }
                                      >
                                        {
                                          usuario.activo ===
                                            false
                                            ? 'Reactivar'
                                            : 'Desactivar'
                                        }
                                      </button>

                                    </div>

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


        <div className="usr-security-note">

          <strong>
            🔐 Seguridad
          </strong>

          <p>
            Los usuarios desactivados conservan sus servicios e historial, pero se bloquea su acceso al sistema. Las cuentas no se eliminan físicamente.
          </p>

        </div>

      </main>


      {
        mostrandoFormulario && (

          <div
            className="usr-modal-overlay"
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

            <div className="usr-modal">

              <header className="usr-modal-header">

                <div>

                  <span>
                    {
                      usuarioEditando
                        ? 'EDITAR USUARIO'
                        : 'NUEVO ACCESO'
                    }
                  </span>

                  <h2>
                    {
                      usuarioEditando
                        ? 'Actualizar usuario'
                        : 'Crear usuario'
                    }
                  </h2>

                  <p>
                    {
                      usuarioEditando
                        ? 'Puedes modificar nombre, teléfono y rol sin perder su historial.'
                        : 'La cuenta quedará activa inmediatamente y podrá iniciar sesión con la contraseña temporal.'
                    }
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
                className="usr-form"
                onSubmit={
                  guardarUsuario
                }
              >

                <div className="usr-form-grid">

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
                      placeholder="Nombre completo"
                      required
                    />

                  </label>


                  <label>

                    <span>
                      Rol *
                    </span>

                    <select
                      value={
                        formulario.rol
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'rol',
                            evento.target.value
                          )
                      }
                    >

                      {
                        ROLES.map(
                          rol => (
                            <option
                              key={
                                rol.value
                              }
                              value={
                                rol.value
                              }
                            >
                              {rol.label}
                            </option>
                          )
                        )
                      }

                    </select>

                  </label>


                  <label>

                    <span>
                      Correo electrónico *
                    </span>

                    <input
                      type="email"
                      value={
                        formulario.email
                      }
                      disabled={
                        Boolean(
                          usuarioEditando
                        )
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'email',
                            evento.target.value
                          )
                      }
                      placeholder="usuario@destapaya.com"
                      required={
                        !usuarioEditando
                      }
                    />

                    {
                      usuarioEditando && (
                        <small>
                          Para seguridad, el correo no se cambia desde esta pantalla.
                        </small>
                      )
                    }

                  </label>


                  <label>

                    <span>
                      Teléfono
                    </span>

                    <input
                      type="tel"
                      value={
                        formulario.telefono
                      }
                      onChange={
                        evento =>
                          cambiarCampo(
                            'telefono',
                            evento.target.value
                          )
                      }
                      placeholder="81 0000 0000"
                    />

                  </label>


                  {
                    !usuarioEditando && (

                      <label className="full">

                        <span>
                          Contraseña temporal *
                        </span>

                        <input
                          type="password"
                          value={
                            formulario.password
                          }
                          onChange={
                            evento =>
                              cambiarCampo(
                                'password',
                                evento.target.value
                              )
                          }
                          minLength="8"
                          placeholder="Mínimo 8 caracteres"
                          required
                        />

                        <small>
                          Entrega esta contraseña al usuario por un medio seguro. Después podremos agregar cambio de contraseña desde su perfil.
                        </small>

                      </label>

                    )
                  }


                  <div className="usr-role-info full">

                    {
                      formulario.rol ===
                        'ADMINISTRADOR'
                        ? (
                          <>
                            <strong>
                              Administrador
                            </strong>

                            <p>
                              Tendrá acceso al Dashboard administrativo, clientes, agenda, servicios, gastos, reportes, vehículos, inventario y gestión de usuarios.
                            </p>
                          </>
                        )
                        : (
                          <>
                            <strong>
                              Técnico
                            </strong>

                            <p>
                              Verá únicamente el flujo operativo asignado para atender y concluir servicios.
                            </p>
                          </>
                        )
                    }

                  </div>

                </div>


                <div className="usr-form-actions">

                  <button
                    type="button"
                    className="cancel"
                    onClick={
                      cerrarFormulario
                    }
                    disabled={
                      procesando
                    }
                  >
                    Cancelar
                  </button>


                  <button
                    type="submit"
                    className="save"
                    disabled={
                      procesando
                    }
                  >
                    {
                      procesando
                        ? 'Guardando...'
                        : usuarioEditando
                          ? 'Guardar cambios'
                          : 'Crear usuario'
                    }
                  </button>

                </div>

              </form>

            </div>

          </div>

        )
      }


      {
        usuarioPassword && (

          <div
            className="usr-modal-overlay"
            onMouseDown={
              evento => {

                if (
                  evento.target ===
                    evento.currentTarget
                ) {
                  cerrarPassword()
                }
              }
            }
          >

            <div className="usr-modal usr-password-modal">

              <header className="usr-modal-header">

                <div>

                  <span>
                    SEGURIDAD DE ACCESO
                  </span>

                  <h2>
                    Cambiar contraseña
                  </h2>

                  <p>
                    Define una nueva contraseña para {usuarioPassword.nombre}. El cambio se aplicará inmediatamente.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    cerrarPassword
                  }
                >
                  ✕
                </button>

              </header>


              <form
                className="usr-form"
                onSubmit={
                  guardarPassword
                }
              >

                <div className="usr-password-user">

                  <div className="usr-avatar">
                    {
                      usuarioPassword
                        .nombre
                        ?.charAt(0)
                        ?.toUpperCase() ||
                      'U'
                    }
                  </div>

                  <div>

                    <strong>
                      {
                        usuarioPassword.nombre
                      }
                    </strong>

                    <span>
                      {
                        usuarioPassword.email
                      }
                    </span>

                  </div>

                </div>


                <div className="usr-form-grid">

                  <label className="full">

                    <span>
                      Nueva contraseña *
                    </span>

                    <input
                      type="password"
                      value={
                        nuevaPassword
                      }
                      onChange={
                        evento =>
                          setNuevaPassword(
                            evento.target.value
                          )
                      }
                      minLength="8"
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      required
                      autoFocus
                    />

                  </label>


                  <label className="full">

                    <span>
                      Confirmar contraseña *
                    </span>

                    <input
                      type="password"
                      value={
                        confirmarPassword
                      }
                      onChange={
                        evento =>
                          setConfirmarPassword(
                            evento.target.value
                          )
                      }
                      minLength="8"
                      autoComplete="new-password"
                      placeholder="Escribe nuevamente la contraseña"
                      required
                    />

                  </label>


                  <div className="usr-password-note full">

                    <strong>
                      🔐 Recomendación
                    </strong>

                    <p>
                      Usa una contraseña temporal de al menos 8 caracteres y compártela con el usuario por un medio seguro.
                    </p>

                  </div>

                </div>


                <div className="usr-form-actions">

                  <button
                    type="button"
                    className="cancel"
                    onClick={
                      cerrarPassword
                    }
                    disabled={
                      procesando
                    }
                  >
                    Cancelar
                  </button>


                  <button
                    type="submit"
                    className="save"
                    disabled={
                      procesando
                    }
                  >
                    {
                      procesando
                        ? 'Actualizando...'
                        : 'Cambiar contraseña'
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


export default Usuarios