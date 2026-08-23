import { useState } from 'react'
import { supabase } from '../supabase'
import './NuevaCita.css'

function NuevaCita({ onVolver, onContinuar }) {
  const [tipoCliente, setTipoCliente] = useState('RESIDENCIAL')

  const [telefono, setTelefono] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')

  const [razonSocial, setRazonSocial] = useState('')
  const [rfc, setRfc] = useState('')
  const [contactoAdministrativo, setContactoAdministrativo] = useState('')
  const [correoAdministrativo, setCorreoAdministrativo] = useState('')

  const [buscando, setBuscando] = useState(false)
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const [mensajeBusqueda, setMensajeBusqueda] = useState('')

  async function buscarCliente() {
    const telefonoLimpio = telefono.replace(/\D/g, '')

    if (telefonoLimpio.length < 7) {
      setMensajeBusqueda('Escribe un teléfono válido antes de buscar.')
      setClienteEncontrado(null)
      return
    }

    setBuscando(true)
    setMensajeBusqueda('')
    setClienteEncontrado(null)

    const { data, error } = await supabase
      .from('clientes')
      .select(`
        id,
        tipo_cliente,
        nombre,
        telefono,
        whatsapp,
        email,
        razon_social,
        rfc,
        contacto_administrativo,
        correo_administrativo
      `)
      .eq('telefono', telefonoLimpio)
      .maybeSingle()

    if (error) {
      console.error(error)

      setMensajeBusqueda(
        'No se pudo realizar la búsqueda: ' + error.message
      )

      setBuscando(false)
      return
    }

    if (!data) {
      setMensajeBusqueda(
        'Cliente nuevo. Completa sus datos para continuar.'
      )

      setWhatsapp(telefonoLimpio)
      setNombre('')
      setEmail('')
      setTipoCliente('RESIDENCIAL')

      setRazonSocial('')
      setRfc('')
      setContactoAdministrativo('')
      setCorreoAdministrativo('')

      setBuscando(false)
      return
    }

    setClienteEncontrado(data)

    setTelefono(data.telefono || telefonoLimpio)
    setWhatsapp(data.whatsapp || data.telefono || '')
    setNombre(data.nombre || '')
    setEmail(data.email || '')
    setTipoCliente(data.tipo_cliente || 'RESIDENCIAL')

    setRazonSocial(data.razon_social || '')
    setRfc(data.rfc || '')
    setContactoAdministrativo(
      data.contacto_administrativo || ''
    )
    setCorreoAdministrativo(
      data.correo_administrativo || ''
    )

    setMensajeBusqueda('Cliente encontrado.')
    setBuscando(false)
  }

  function continuar() {
    const telefonoLimpio = telefono.replace(/\D/g, '')
    const whatsappLimpio = whatsapp.replace(/\D/g, '')

    if (!telefonoLimpio) {
      alert('Captura el teléfono del cliente.')
      return
    }

    if (!nombre.trim()) {
      alert('Captura el nombre del cliente.')
      return
    }

    const cliente = {
      id: clienteEncontrado?.id || null,

      tipo_cliente: tipoCliente,

      nombre: nombre.trim(),

      telefono: telefonoLimpio,

      whatsapp: whatsappLimpio,

      email: email.trim(),

      razon_social: razonSocial.trim(),

      rfc: rfc.trim(),

      contacto_administrativo:
        contactoAdministrativo.trim(),

      correo_administrativo:
        correoAdministrativo.trim(),

      es_nuevo: !clienteEncontrado
    }

    onContinuar(cliente)
  }

  return (
    <div className="nc-page">

      <header className="nc-topbar">

        <div>

          <button
            className="nc-back"
            onClick={onVolver}
          >
            ← Volver
          </button>

          <h1>Nueva cita</h1>

          <p>
            Registra una nueva solicitud de servicio
          </p>

        </div>

        <div className="nc-brand">
          DESTAPA YA
        </div>

      </header>


      <main className="nc-content">

        {/* PROGRESO */}

        <div className="nc-progress">

          <div className="nc-step active">
            <span>1</span>
            Cliente
          </div>

          <div className="nc-line" />

          <div className="nc-step">
            <span>2</span>
            Dirección
          </div>

          <div className="nc-line" />

          <div className="nc-step">
            <span>3</span>
            Servicio
          </div>

          <div className="nc-line" />

          <div className="nc-step">
            <span>4</span>
            Programación
          </div>

        </div>


        {/* CARD */}

        <section className="nc-card">

          <div className="nc-card-header">

            <div>

              <span className="nc-eyebrow">
                DATOS DEL CLIENTE
              </span>

              <h2>
                ¿Quién solicita el servicio?
              </h2>

              <p>
                Escribe el teléfono y presiona
                Buscar cliente.
              </p>

            </div>

            <div className="nc-icon">
              👤
            </div>

          </div>


          {/* BUSQUEDA */}

          <div className="nc-search-row">

            <div className="nc-field nc-search-field">

              <label>
                Teléfono *
              </label>

              <input
                type="tel"
                value={telefono}
                onChange={(e) =>
                  setTelefono(e.target.value)
                }
                placeholder="81 1234 5678"
              />

            </div>


            <button
              type="button"
              className="nc-search-button"
              onClick={buscarCliente}
              disabled={buscando}
            >
              {buscando
                ? 'Buscando...'
                : 'Buscar cliente'}
            </button>

          </div>


          {/* RESULTADO BUSQUEDA */}

          {mensajeBusqueda && (

            <div
              className={
                clienteEncontrado
                  ? 'nc-client-status found'
                  : 'nc-client-status'
              }
            >

              {clienteEncontrado ? (

                <>

                  <strong>
                    ✓ Cliente existente
                  </strong>

                  <span>
                    {clienteEncontrado.nombre}
                  </span>

                </>

              ) : (

                <>

                  <strong>
                    {mensajeBusqueda.includes('nuevo')
                      ? '+ Cliente nuevo'
                      : 'Información'}
                  </strong>

                  <span>
                    {mensajeBusqueda}
                  </span>

                </>

              )}

            </div>

          )}


          {/* DATOS PRINCIPALES */}

          <div className="nc-grid two">

            <div className="nc-field">

              <label>
                WhatsApp
              </label>

              <input
                type="tel"
                value={whatsapp}
                onChange={(e) =>
                  setWhatsapp(e.target.value)
                }
                placeholder="81 1234 5678"
              />

            </div>


            <div className="nc-field">

              <label>
                Nombre del cliente *
              </label>

              <input
                type="text"
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
                placeholder="Nombre completo"
              />

            </div>

          </div>


          <div className="nc-grid two">

            <div className="nc-field">

              <label>
                Correo electrónico
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="correo@ejemplo.com"
              />

            </div>


            <div className="nc-field">

              <label>
                Tipo de cliente *
              </label>

              <div className="nc-type-selector compact">

                <button
                  type="button"
                  className={
                    tipoCliente === 'RESIDENCIAL'
                      ? 'selected'
                      : ''
                  }
                  onClick={() =>
                    setTipoCliente('RESIDENCIAL')
                  }
                >
                  🏠
                  <span>
                    Residencial
                  </span>
                </button>


                <button
                  type="button"
                  className={
                    tipoCliente === 'COMERCIAL'
                      ? 'selected'
                      : ''
                  }
                  onClick={() =>
                    setTipoCliente('COMERCIAL')
                  }
                >
                  🏪
                  <span>
                    Comercial
                  </span>
                </button>


                <button
                  type="button"
                  className={
                    tipoCliente === 'INDUSTRIAL'
                      ? 'selected'
                      : ''
                  }
                  onClick={() =>
                    setTipoCliente('INDUSTRIAL')
                  }
                >
                  🏭
                  <span>
                    Industrial
                  </span>
                </button>

              </div>

            </div>

          </div>


          {/* EMPRESA */}

          {tipoCliente !== 'RESIDENCIAL' && (

            <div className="nc-company-box">

              <div className="nc-grid two">

                <div className="nc-field">

                  <label>
                    Razón social
                  </label>

                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) =>
                      setRazonSocial(e.target.value)
                    }
                    placeholder="Razón social"
                  />

                </div>


                <div className="nc-field">

                  <label>
                    RFC
                  </label>

                  <input
                    type="text"
                    value={rfc}
                    onChange={(e) =>
                      setRfc(e.target.value)
                    }
                    placeholder="RFC"
                  />

                </div>

              </div>


              <div className="nc-grid two">

                <div className="nc-field">

                  <label>
                    Contacto administrativo
                  </label>

                  <input
                    type="text"
                    value={contactoAdministrativo}
                    onChange={(e) =>
                      setContactoAdministrativo(
                        e.target.value
                      )
                    }
                    placeholder="Nombre del contacto"
                  />

                </div>


                <div className="nc-field">

                  <label>
                    Correo administrativo
                  </label>

                  <input
                    type="email"
                    value={correoAdministrativo}
                    onChange={(e) =>
                      setCorreoAdministrativo(
                        e.target.value
                      )
                    }
                    placeholder="administracion@empresa.com"
                  />

                </div>

              </div>

            </div>

          )}


          {/* BOTONES */}

          <div className="nc-actions">

            <button
              type="button"
              className="nc-secondary"
              onClick={onVolver}
            >
              Cancelar
            </button>


            <button
              type="button"
              className="nc-primary"
              onClick={continuar}
            >
              Continuar →
            </button>

          </div>

        </section>

      </main>

    </div>
  )
}

export default NuevaCita