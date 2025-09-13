import dbConnect from '@/lib/dbConnect';
import Work from '@/models/Work';

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { usn, name } = body;

    if (!usn || !name) return new Response(JSON.stringify({ message: 'USN and Name required' }), { status: 400 });

    const usnUpper = usn.toUpperCase();
    let user = await Work.findOne({ usn: usnUpper });

    if (!user) {
      user = await Work.create({ usn: usnUpper, name });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
