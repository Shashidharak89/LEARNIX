import dbConnect from '@/lib/dbConnect';
import Work from '@/models/Work';
import cloudinary from '@/lib/cloudinary';
import formidable from 'formidable';

export const config = { api: { bodyParser: false } };

export async function POST(req) {
  await dbConnect();
  return new Promise((resolve) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) return resolve(new Response(JSON.stringify({ message: err.message }), { status: 500 }));

      const { usn, subjectId, contentId } = fields;
      if (!usn || !subjectId || !contentId) return resolve(new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 }));

      if (!files.file) return resolve(new Response(JSON.stringify({ message: 'No file uploaded' }), { status: 400 }));

      try {
        const result = await cloudinary.uploader.upload(files.file.filepath, {
          folder: 'works',
          resource_type: 'auto'
        });

        const user = await Work.findOne({ usn: usn.toUpperCase() });
        if (!user) return resolve(new Response(JSON.stringify({ message: 'User not found' }), { status: 404 }));

        const subject = user.contents.id(subjectId);
        if (!subject) return resolve(new Response(JSON.stringify({ message: 'Subject not found' }), { status: 404 }));

        const content = subject.items.id(contentId);
        if (!content) return resolve(new Response(JSON.stringify({ message: 'Content not found' }), { status: 404 }));

        content.files.push({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type
        });

        await user.save();
        return resolve(new Response(JSON.stringify({ message: 'File uploaded successfully', file: result.secure_url }), { status: 200 }));
      } catch (err2) {
        return resolve(new Response(JSON.stringify({ message: err2.message }), { status: 500 }));
      }
    });
  });
}
