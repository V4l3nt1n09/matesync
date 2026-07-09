export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted sm:flex-row sm:justify-between sm:text-left">
        <p>© {new Date().getFullYear()} MateSync. Projet en construction.</p>
        <p>
          MateSync n&apos;est ni affilié ni approuvé par Nintendo. Nintendo
          Switch est une marque de Nintendo Co., Ltd.
        </p>
      </div>
    </footer>
  );
}
