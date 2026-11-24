import '../../src/console.css';

export function Violations() {
  return (
    <>
      <div style={{ display: 'flex' }} />
      <div dangerouslySetInnerHTML={{ __html: '<b>x</b>' }} />
      <dialog open />
    </>
  );
}
