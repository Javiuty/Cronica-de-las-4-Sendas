import { RESULTADO } from '../juego/datos'
import { IconoD20 } from './Iconos'
import './Dado.css'

// Velo a pantalla completa con un d20 de piedra rodando y, al parar, el resultado.
export default function Dado({ dado }) {
  if (!dado) return null
  const res = dado.girando ? null : RESULTADO[dado.resultado] || RESULTADO.coste
  const detalle = dado.girando
    ? 'rueda el dado'
    : 'd20 ' + dado.cara +
      (dado.mod ? (dado.mod > 0 ? ' +' + dado.mod : ' ' + dado.mod) : '') +
      ' = ' + dado.total + ' · dificultad ' + dado.dif +
      (dado.notas ? ' · ' + dado.notas : '')

  return (
    <div className="dado" role="status" aria-live="polite">
      <div className={'dado__marco ' + (dado.girando ? 'dado__marco--girando' : 'dado__marco--parado')}>
        <span className="dado__borde" aria-hidden="true" />
        <span className="dado__piedra" aria-hidden="true" />
        <span className="dado__aristas" aria-hidden="true"><IconoD20 /></span>
        <span className="dado__sombra" aria-hidden="true" />
        <span className="dado__numero">{dado.cara}</span>
      </div>
      <div className="placa dado__placa">
        <div className="dado__detalle">{detalle}</div>
        <div className={'dado__resultado' + (res ? ' dado__resultado--visible' : '')} style={{ color: res ? res.color : 'transparent' }}>
          {res ? res.texto : ''}
        </div>
      </div>
    </div>
  )
}
