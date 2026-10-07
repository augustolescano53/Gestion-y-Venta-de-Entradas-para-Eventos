import { useParams } from 'react-router-dom';

function CheckoutPage() {
  const { id } = useParams();

  return (
    <section>
      <h1>Comprar entradas</h1>
      <p>Evento: {id}</p>
    </section>
  );
}

export default CheckoutPage;
