import { Link } from "react-router-dom";


function CambiaPagina({pagina, tipologia = "predefinito",children, ...altro} ){
    return (
        <Link key= {pagina} to = {pagina} className={`${tipologia}`} {...altro}>
            {children}
        </Link>
    );
}
export default CambiaPagina