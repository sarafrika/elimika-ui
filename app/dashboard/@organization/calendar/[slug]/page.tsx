import * as calendar from "../../../_components/calendar";
export default async function Calendarlayout({
    params
}: {
    params: Promise<{ slug: "monthly" | "weekly" | "daily" }>
}) {

    const { slug } = await params;
    console.log(slug);
    const View = calendar[slug];

    return (<>
        <View date={new Date()} />
    </>);
}