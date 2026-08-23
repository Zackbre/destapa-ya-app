import { useState } from 'react'

import Login from './Pages/Login.jsx'
import Dashboard from './Pages/Dashboard.jsx'
import Clientes from './Pages/Clientes.jsx'

import NuevaCita from './Pages/NuevaCita.jsx'
import DireccionCita from './Pages/DireccionCita.jsx'
import ServicioCita from './Pages/ServicioCita.jsx'
import ProgramacionCita from './Pages/ProgramacionCita.jsx'
import CitaConfirmada from './Pages/CitaConfirmada.jsx'

import Agenda from './Pages/Agenda.jsx'
import Servicios from './Pages/Servicios.jsx'
import Reportes from './Pages/Reportes.jsx'
import Gastos from './Pages/Gastos.jsx'
import Vehiculos from './Pages/Vehiculos.jsx'
import Inventario from './Pages/Inventario.jsx'
import Usuarios from './Pages/Usuarios.jsx'

import Tecnico from './Pages/Tecnico.jsx'


function App() {
  const [perfil, setPerfil] = useState(null)

  const [pantalla, setPantalla] =
    useState('dashboard')

  const [clienteCita, setClienteCita] =
    useState(null)

  const [direccionCita, setDireccionCita] =
    useState(null)

  const [servicioCita, setServicioCita] =
    useState(null)

  const [resultadoCita, setResultadoCita] =
    useState(null)

  const [servicioInicialId, setServicioInicialId] =
    useState(null)


  // ==========================================
  // DETERMINAR ROL
  // ==========================================

  function obtenerRol(usuario) {
    if (!usuario) {
      return null
    }

    if (usuario.roles?.nombre) {
      return usuario.roles.nombre
        .trim()
        .toUpperCase()
    }

    if (Number(usuario.rol_id) === 1) {
      return 'ADMINISTRADOR'
    }

    if (Number(usuario.rol_id) === 2) {
      return 'TECNICO'
    }

    return null
  }


  const rolActual =
    obtenerRol(perfil)


  // ==========================================
  // LOGIN
  // ==========================================

  function manejarLogin(perfilUsuario) {
    console.log(
      'Perfil recibido:',
      perfilUsuario
    )

    console.log(
      'Rol detectado:',
      obtenerRol(perfilUsuario)
    )

    setPerfil(perfilUsuario)
    setPantalla('dashboard')
    setServicioInicialId(null)
  }


  // ==========================================
  // LOGOUT
  // ==========================================

  function manejarLogout() {
    setPerfil(null)
    setPantalla('dashboard')

    setClienteCita(null)
    setDireccionCita(null)
    setServicioCita(null)
    setResultadoCita(null)
    setServicioInicialId(null)
  }


  // ==========================================
  // NUEVA CITA
  // ==========================================

  function iniciarNuevaCita() {
    setClienteCita(null)
    setDireccionCita(null)
    setServicioCita(null)
    setResultadoCita(null)
    setServicioInicialId(null)

    setPantalla('nueva-cita')
  }


  // ==========================================
  // NUEVA CITA DESDE CLIENTES
  // ==========================================

  function iniciarCitaDesdeCliente(cliente) {
    setClienteCita(cliente)
    setDireccionCita(null)
    setServicioCita(null)
    setResultadoCita(null)
    setServicioInicialId(null)

    setPantalla('direccion-cita')
  }


  // ==========================================
  // ABRIR SERVICIO DESDE CLIENTES
  // ==========================================

  function abrirServicioDesdeCliente(servicio) {
    const id =
      servicio?.servicioRealId ||
      servicio?.id ||
      null

    if (!id) {
      window.alert(
        'Esta cita todavía no tiene un servicio generado.'
      )
      return
    }

    setServicioInicialId(id)
    setPantalla('servicios')
  }


  // ==========================================
  // NO AUTENTICADO
  // ==========================================

  if (!perfil) {
    return (
      <Login
        onLogin={manejarLogin}
      />
    )
  }


  // ==========================================
  // ADMINISTRADOR
  // ==========================================

  if (
    rolActual ===
    'ADMINISTRADOR'
  ) {

    // ------------------------------------------
    // CLIENTES
    // ------------------------------------------

    if (
      pantalla ===
      'clientes'
    ) {
      return (
        <Clientes
          onVolver={() => {
            setPantalla('dashboard')
          }}

          onNuevaCitaCliente={
            iniciarCitaDesdeCliente
          }

          onVerServicio={
            abrirServicioDesdeCliente
          }
        />
      )
    }


    // ------------------------------------------
    // NUEVA CITA
    // ------------------------------------------

    if (
      pantalla ===
      'nueva-cita'
    ) {
      return (
        <NuevaCita
          onVolver={() => {
            setPantalla('dashboard')
          }}

          onContinuar={(cliente) => {
            setClienteCita(cliente)
            setDireccionCita(null)
            setServicioCita(null)
            setResultadoCita(null)

            setPantalla('direccion-cita')
          }}
        />
      )
    }


    // ------------------------------------------
    // DIRECCION
    // ------------------------------------------

    if (
      pantalla ===
      'direccion-cita'
    ) {
      return (
        <DireccionCita
          cliente={clienteCita}

          direccionSeleccionada={
            direccionCita
          }

          onVolver={() => {
            setPantalla('nueva-cita')
          }}

          onContinuar={(direccion) => {
            setDireccionCita(direccion)
            setPantalla('servicio-cita')
          }}
        />
      )
    }


    // ------------------------------------------
    // SERVICIO
    // ------------------------------------------

    if (
      pantalla ===
      'servicio-cita'
    ) {
      return (
        <ServicioCita
          cliente={clienteCita}
          direccion={direccionCita}
          datosServicio={servicioCita}

          onVolver={() => {
            setPantalla('direccion-cita')
          }}

          onContinuar={(servicio) => {
            setServicioCita(servicio)
            setPantalla('programacion-cita')
          }}
        />
      )
    }


    // ------------------------------------------
    // PROGRAMACION
    // ------------------------------------------

    if (
      pantalla ===
      'programacion-cita'
    ) {
      return (
        <ProgramacionCita
          perfil={perfil}
          cliente={clienteCita}
          direccion={direccionCita}
          servicio={servicioCita}

          onVolver={() => {
            setPantalla('servicio-cita')
          }}

          onFinalizar={(resultado) => {
            setResultadoCita(resultado)
            setPantalla('cita-confirmada')
          }}
        />
      )
    }


    // ------------------------------------------
    // CONFIRMACION DE CITA
    // ------------------------------------------

    if (
      pantalla ===
      'cita-confirmada'
    ) {
      return (
        <CitaConfirmada
          resultado={resultadoCita}
          servicio={servicioCita}

          onDashboard={() => {
            setResultadoCita(null)
            setClienteCita(null)
            setDireccionCita(null)
            setServicioCita(null)

            setPantalla('dashboard')
          }}
        />
      )
    }


    // ------------------------------------------
    // AGENDA
    // ------------------------------------------

    if (
      pantalla ===
      'agenda'
    ) {
      return (
        <Agenda
          onVolver={() => {
            setPantalla('dashboard')
          }}
        />
      )
    }


    // ------------------------------------------
    // SERVICIOS
    // ------------------------------------------

    if (
      pantalla ===
      'servicios'
    ) {
      return (
        <Servicios
          perfil={perfil}

          servicioInicialId={
            servicioInicialId
          }

          onVolver={() => {
            setServicioInicialId(null)
            setPantalla('dashboard')
          }}
        />
      )
    }






    // ------------------------------------------
    // USUARIOS
    // ------------------------------------------

    if (
      pantalla ===
      'usuarios'
    ) {

      if (
        perfil
          ?.roles
          ?.nombre !==
        'ADMINISTRADOR'
      ) {
        return (
          <Dashboard
            perfil={perfil}
            onLogout={cerrarSesion}
          />
        )
      }

      return (
        <Usuarios
          perfil={perfil}
          onVolver={() => {
            setPantalla('dashboard')
          }}
        />
      )
    }


    // ------------------------------------------
    // INVENTARIO / HERRAMIENTAS
    // ------------------------------------------

    if (
      pantalla ===
      'inventario'
    ) {
      return (
        <Inventario
          onVolver={() => {
            setPantalla('dashboard')
          }}
        />
      )
    }


    // ------------------------------------------
    // VEHICULOS
    // ------------------------------------------

    if (
      pantalla ===
      'vehiculos'
    ) {
      return (
        <Vehiculos
          onVolver={() => {
            setPantalla('dashboard')
          }}
        />
      )
    }


    // ------------------------------------------
    // GASTOS
    // ------------------------------------------

    if (
      pantalla ===
      'gastos'
    ) {
      return (
        <Gastos
          onVolver={() => {
            setPantalla('dashboard')
          }}
        />
      )
    }


    // ------------------------------------------
    // REPORTES
    // ------------------------------------------

    if (
      pantalla ===
      'reportes'
    ) {
      return (
        <Reportes
          onVolver={() => {
            setPantalla('dashboard')
          }}
        />
      )
    }


    // ------------------------------------------
    // DASHBOARD
    // ------------------------------------------

    return (
      <Dashboard
        perfil={perfil}
        onLogout={manejarLogout}
        onNuevaCita={iniciarNuevaCita}

        onAgenda={() => {
          setServicioInicialId(null)
          setPantalla('agenda')
        }}

        onClientes={() => {
          setServicioInicialId(null)
          setPantalla('clientes')
        }}

        onServicios={() => {
          setServicioInicialId(null)
          setPantalla('servicios')
        }}

        onReportes={() => {
          setServicioInicialId(null)
          setPantalla('reportes')
        }}

        onGastos={() => {
          setServicioInicialId(null)
          setPantalla('gastos')
        }}

        onVehiculos={() => {
          setServicioInicialId(null)
          setPantalla('vehiculos')
        }}

        onInventario={() => {
          setServicioInicialId(null)
          setPantalla('inventario')
        }}

        onUsuarios={() => {
          setServicioInicialId(null)
          setPantalla('usuarios')
        }}
      />
    )
  }


  // ==========================================
  // TECNICO
  // ==========================================

  if (
    rolActual ===
    'TECNICO'
  ) {
    return (
      <Tecnico
        perfil={perfil}
        onLogout={manejarLogout}
      />
    )
  }


  // ==========================================
  // ROL NO RECONOCIDO
  // ==========================================

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F7FA',
        padding: '40px',
        fontFamily:
          'Montserrat, sans-serif',
        color: '#0D1B3D'
      }}
    >
      <h1>
        DESTAPA YA
      </h1>

      <h2>
        Rol no reconocido
      </h2>

      <p>
        El usuario inició sesión correctamente,
        pero el sistema no pudo identificar su rol.
      </p>

      <p>
        Rol ID detectado:{' '}
        <strong>
          {perfil?.rol_id ?? 'No disponible'}
        </strong>
      </p>

      <p>
        Rol detectado:{' '}
        <strong>
          {rolActual ?? 'No disponible'}
        </strong>
      </p>

      <button
        type="button"
        onClick={manejarLogout}
      >
        Cerrar sesión
      </button>
    </div>
  )
}


export default App