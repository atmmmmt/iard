import Client from "./Client";

// Prerendered once for static export; public/.htaccess routes every real value here.
export function generateStaticParams(){return[{id:"_"}]}

export default function Page(){return <Client/>}
