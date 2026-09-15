import { useEffect, useState } from 'react'
import './App.css'
import './piedra.css'
import Aves from './componentes/Aves'
import Dado from './componentes/Dado'
import Fondo from './componentes/Fondo'
import FondoFX from './componentes/FondoFX'
import { establecerAmbiente } from './juego/ambiente'
import { ambienteDe, efectosDe } from './juego/derivados'
import { useCronica } from './juego/useCronica'
import Carga from './pantallas/Carga'
import Cuenta from './pantallas/Cuenta'
import Fin from './pantallas/Fin'
import Juego from './pantallas/Juego'
import Menu from './pantallas/Menu'
import Opciones from './pantallas/Opciones'
import Personaje from './pantallas/Personaje'
import Reglas from './pantallas/Reglas'

export default function App() {
  const c = useCronica()
  const { s } = c
  // Las losas del menú avivan las pavesas del fondo al pasar el ratón.
  const [avivar, setAvivar] = useState(false)

  let pantalla = null
  switch (s.fase) {
    case 'menu':
      pantalla = (
        <Menu
          haySave={s.haySave}
          sesion={s.sesion}
          irPersonaje={c.irPersonaje}
          continuar={c.continuar}
          irOpciones={c.irOpciones}
          irReglas={c.irReglas}
          irCuenta={c.irCuenta}
          onAvivar={setAvivar}
        />
      )
      break
    case 'opciones':
      pantalla = (
        <Opciones
          s={s}
          elegirDificultad={c.elegirDificultad}
          elegirDuracion={c.elegirDuracion}
          toggleSellos={c.toggleSellos}
          toggleMusica={c.toggleMusica}
          toggleEfectos={c.toggleEfectos}
          toggleAmbiente={c.toggleAmbiente}
          irMenu={c.irMenu}
        />
      )
      break
    case 'reglas':
      pantalla = <Reglas irPersonaje={c.irPersonaje} irMenu={c.irMenu} />
      break
    case 'cuenta':
      pantalla = (
        <Cuenta
          s={s}
          entrar={c.entrar}
          registrarse={c.registrarse}
          salir={c.salir}
          irMenu={c.irMenu}
        />
      )
      break
    case 'personaje':
      pantalla = (
        <Personaje
          s={s}
          elegirOficio={c.elegirOficio}
          elegirObjeto={c.elegirObjeto}
          elegirRetrato={c.elegirRetrato}
          setNombre={c.setNombre}
          nombreAzar={c.nombreAzar}
          comenzar={c.comenzar}
          irMenu={c.irMenu}
        />
      )
      break
    case 'carga':
      pantalla = <Carga s={s} reintentar={c.reintentar} irMenu={c.irMenu} />
      break
    case 'juego':
      pantalla = (
        <Juego
          s={s}
          logRef={c.logRef}
          elegir={c.elegir}
          invocar={c.invocar}
          reintentar={c.reintentar}
          abandonar={c.abandonar}
        />
      )
      break
    case 'fin':
      pantalla = <Fin s={s} irPersonaje={c.irPersonaje} irMenu={c.irMenu} />
      break
    default:
      pantalla = null
  }

  const intensidad = s.cargando ? 1 : avivar && s.fase === 'menu' ? 0.95 : 0.6

  // Escena actual del cronista (solo en partida y en el cierre): fondo y clima.
  const escena = s.fase === 'juego' || s.fase === 'fin' ? s.escena : null
  const cielo = escena && escena.cielo ? String(escena.cielo).toLowerCase() : null
  const terreno = escena && escena.terreno ? String(escena.terreno).toLowerCase() : null
  const precipitacion = terreno === 'nieve' && (cielo === 'tormenta' || cielo === 'noche' || cielo === 'niebla')
    ? 'nieve'
    : cielo === 'tormenta' ? 'lluvia'
      : (terreno === 'yermo' || terreno === 'arena') && cielo !== 'niebla' ? 'polvo' : null
  const nieblaExtra = cielo === 'niebla' ? 1 : 0
  const relampagos = cielo === 'tormenta'
  const enEscena = !!escena

  // Sonido de ambiente según la escena (se apaga fuera de la partida)
  const ambienteOn = ambienteDe(s)
  useEffect(() => {
    establecerAmbiente(ambienteOn && enEscena, enEscena ? { cielo, terreno } : null)
  }, [ambienteOn, enEscena, cielo, terreno])

  return (
    <>
      <Fondo escena={escena} vivo cielo={cielo} paralaje />
      <div className="velo velo--vertical velo--suave" />
      <div className="velo velo--radial velo--suave" />
      <div className={'velo velo--cielo' + (cielo ? ' velo--cielo-' + cielo : '')} />
      {efectosDe(s) && (
        <FondoFX intensidad={intensidad} precipitacion={precipitacion} niebla={nieblaExtra} relampagos={relampagos} />
      )}
      {efectosDe(s) && enEscena && <Aves cielo={cielo} />}

      <div className="escenario">{pantalla}</div>

      <Dado dado={s.dado} />
    </>
  )
}
