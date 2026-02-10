import { redirect } from 'next/navigation';

export default function CuratorRoot() {
  redirect('/curator/courses');
}
