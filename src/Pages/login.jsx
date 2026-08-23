import { useState } from 'react'
import { supabase } from '../supabase'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function iniciarSesion(e) {
    e.preventDefault()

    setCargando(true)
    setMensaje('')

    try {

      // ==========================================
      // 1. AUTENTICACION
      // ==========================================

      const {
        data: authData,
        error: authError
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (authError) {
        setMensaje(
          '❌ No fue posible iniciar sesión: ' +
          authError.message
        )

        setCargando(false)
        return
      }

      if (!authData?.user?.id) {
        setMensaje(
          '❌ No fue posible identificar al usuario.'
        )

        setCargando(false)
        return
      }


      // ==========================================
      // 2. BUSCAR PERFIL
      // ==========================================

      const {
        data: perfilEncontrado,
        error: perfilError
      } = await supabase
        .from('perfiles')
        .select(`
          id,
          rol_id,
          nombre,
          telefono,
          activo
        `)
        .eq(
          'id',
          authData.user.id
        )
        .maybeSingle()


      if (perfilError) {
        console.error(
          'Error obteniendo perfil:',
          perfilError
        )

        setMensaje(
          '⚠️ Login correcto, pero no se pudo obtener el perfil: ' +
          perfilError.message
        )

        setCargando(false)
        return
      }


      if (!perfilEncontrado) {
        setMensaje(
          '⚠️ El usuario inició sesión, pero no tiene un perfil registrado.'
        )

        setCargando(false)
        return
      }


      // ==========================================
      // 3. VALIDAR ACTIVO
      // ==========================================

      if (!perfilEncontrado.activo) {

        await supabase.auth.signOut()

        setMensaje(
          '⛔ Este usuario se encuentra desactivado.'
        )

        setCargando(false)
        return
      }


      // ==========================================
      // 4. DETERMINAR ROL
      // ==========================================

      let nombreRol = null

      if (
        Number(perfilEncontrado.rol_id) === 1
      ) {
        nombreRol = 'ADMINISTRADOR'
      }

      if (
        Number(perfilEncontrado.rol_id) === 2
      ) {
        nombreRol = 'TECNICO'
      }


      if (!nombreRol) {

        setMensaje(
          '⚠️ El usuario no tiene un rol válido asignado.'
        )

        setCargando(false)
        return
      }


      // ==========================================
      // 5. CONSTRUIR PERFIL COMPLETO
      // ==========================================

      const perfilCompleto = {

        ...perfilEncontrado,

        email:
          authData.user.email,

        roles: {
          id:
            Number(
              perfilEncontrado.rol_id
            ),

          nombre:
            nombreRol
        }

      }


      console.log(
        'Perfil completo:',
        perfilCompleto
      )

      console.log(
        'Rol detectado:',
        nombreRol
      )


      // ==========================================
      // 6. ENVIAR A APP
      // ==========================================

      onLogin(
        perfilCompleto
      )

    } catch (error) {

      console.error(
        'Error inesperado:',
        error
      )

      setMensaje(
        '❌ Ocurrió un error inesperado al iniciar sesión.'
      )

    } finally {

      setCargando(false)

    }
  }


  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #F5F7FA 0%, #EDF5FC 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily:
          'Montserrat, Arial, sans-serif',
        padding: '20px'
      }}
    >

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FFFFFF',
          borderRadius: '26px',
          padding: '42px 38px',
          boxShadow:
            '0 24px 70px rgba(13,27,61,.12)',
          border:
            '1px solid #E5EAF0'
        }}
      >

        <div
          style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}
        >

          <div
            style={{
              width: '68px',
              height: '68px',
              margin: '0 auto 16px',
              borderRadius: '20px',
              background:
                'linear-gradient(135deg, #0077CC, #1598F5)',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              fontWeight: '800',
              fontSize: '22px',
              boxShadow:
                '0 12px 30px rgba(0,119,204,.22)'
            }}
          >
            DY
          </div>


          <h1
            style={{
              margin: 0,
              color: '#0D1B3D',
              fontSize: '31px',
              fontWeight: '800'
            }}
          >
            DESTAPA YA
          </h1>


          <p
            style={{
              color: '#6B6F76',
              margin: '7px 0 0',
              fontSize: '12px'
            }}
          >
            Rapidez · Limpieza · Confianza
          </p>

        </div>


        <div
          style={{
            marginBottom: '24px'
          }}
        >

          <h2
            style={{
              color: '#0D1B3D',
              margin: '0 0 5px',
              fontSize: '21px'
            }}
          >
            Iniciar sesión
          </h2>


          <p
            style={{
              color: '#8B95A5',
              margin: 0,
              fontSize: '11px'
            }}
          >
            Ingresa tus credenciales para continuar
          </p>

        </div>


        <form
          onSubmit={iniciarSesion}
        >

          <div
            style={{
              marginBottom: '18px'
            }}
          >

            <label
              style={{
                display: 'block',
                color: '#0D1B3D',
                fontWeight: '700',
                fontSize: '11px',
                marginBottom: '7px'
              }}
            >
              Correo electrónico
            </label>


            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              required
              autoComplete="email"
              placeholder="correo@ejemplo.com"
              style={{
                boxSizing: 'border-box',
                width: '100%',
                padding: '14px 15px',
                borderRadius: '12px',
                border:
                  '1px solid #DDE3EA',
                outline: 'none',
                background: '#FBFCFE',
                fontSize: '13px',
                color: '#0D1B3D'
              }}
            />

          </div>


          <div
            style={{
              marginBottom: '24px'
            }}
          >

            <label
              style={{
                display: 'block',
                color: '#0D1B3D',
                fontWeight: '700',
                fontSize: '11px',
                marginBottom: '7px'
              }}
            >
              Contraseña
            </label>


            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
              autoComplete="current-password"
              placeholder="••••••••••"
              style={{
                boxSizing: 'border-box',
                width: '100%',
                padding: '14px 15px',
                borderRadius: '12px',
                border:
                  '1px solid #DDE3EA',
                outline: 'none',
                background: '#FBFCFE',
                fontSize: '13px',
                color: '#0D1B3D'
              }}
            />

          </div>


          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              minHeight: '49px',
              padding: '14px',
              border: 0,
              borderRadius: '13px',
              background:
                cargando
                  ? '#A8CDE8'
                  : 'linear-gradient(135deg, #0077CC, #1598F5)',
              color: '#FFFFFF',
              cursor:
                cargando
                  ? 'wait'
                  : 'pointer',
              fontWeight: '800',
              fontSize: '11px',
              boxShadow:
                cargando
                  ? 'none'
                  : '0 10px 25px rgba(0,119,204,.20)'
            }}
          >
            {cargando
              ? 'INGRESANDO...'
              : 'INICIAR SESIÓN'}
          </button>

        </form>


        {mensaje && (

          <div
            style={{
              marginTop: '20px',
              padding: '13px 15px',
              borderRadius: '12px',
              background: '#F8FAFC',
              border:
                '1px solid #E5EAF0',
              color: '#6B6F76',
              fontSize: '11px',
              lineHeight: '1.5'
            }}
          >
            {mensaje}
          </div>

        )}


        <div
          style={{
            marginTop: '28px',
            paddingTop: '18px',
            borderTop:
              '1px solid #EDF0F4',
            textAlign: 'center',
            color: '#98A1AE',
            fontSize: '9px'
          }}
        >
          DESTAPA YA · Sistema de Gestión Operativa
        </div>

      </div>

    </div>
  )
}

export default Login