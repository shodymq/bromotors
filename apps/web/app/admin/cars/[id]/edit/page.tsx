import { CarEditor } from '../../../../../components/Admin';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CarEditor id={id} />; }
