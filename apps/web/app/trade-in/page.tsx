import { Header } from '../../components/Header';
import { TradeInForm } from '../../components/TradeInForm';

export default function TradeInPage() {
  return <><Header /><main className="section"><div className="container"><h1 style={{ fontSize: 54 }}>Trade-in</h1><p className="lead">Оставьте данные текущего авто, менеджер BRO MOTORS оценит условия обмена.</p><TradeInForm /></div></main></>;
}
