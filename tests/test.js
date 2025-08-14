
import { join, dirname } from 'path';
import { readdir, readFile, writeFile  } from 'fs/promises';
import { fileURLToPath } from 'url';
import { parserAutoDetect, makeSerializer, makeGrammar } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dirs = [
	{dir: 'all', skip: {
		"CSexample.rnw": "file cut at end",
		"dining-fair+safe.rnw": "de.uni_hamburg.tgi.renew.marianets.QueryFigure?",
		"dining.rnw": "de.uni_hamburg.tgi.renew.marianets.QueryFigure?",
		"mutex (2).rnw": "de.uni_hamburg.tgi.renew.marianets.QueryFigure?",
		//"service.rnw": "de.renew.sdnet.gui.SDNDrawing?",
		//"FSsample.rnw": "fs.TypeFigure?",
		"siedler2_spielrunde (2).aip": "invalid file?",
	}, ignore: false},
	{dir: 'aips', skip: {
		"siedler2_spielrunde (2).aip": "invalid file?",
	}, ignore: false}
]

const expectedKeys = new Set([ 'version', 'doctype', 'drawing', 'refMap', 'metaKeys' ]);


outer: for (const {dir, skip, ignore} of dirs) {
	if(ignore) continue;

	const entries = await readdir(join(__dirname, 'examples', dir), { withFileTypes: true });
	
	inner: for (const dirEntry of entries) {
		if (dirEntry.isFile()) {

			if(skip[dirEntry.name]) {
				process.stdout.write("S");
				continue;
			}
			const testFile =  join(__dirname, 'examples', dir, dirEntry.name)
			const content = await readFile(testFile, 'utf-8');

			try {
				const parsed = parserAutoDetect(content, false)
				const resultKeys = new Set(Object.keys(parsed));
			  const ser = makeSerializer(makeGrammar(parsed.version))

				const s = ser(parsed.refMap);
				s.context.writeVersion();
				s.context.writeStorable(parsed.drawing);
				const serialized = s.output.join(" ")
				const reparsed = parserAutoDetect(serialized, false)

				if(reparsed.version === parsed.version && setsEqual(resultKeys, expectedKeys) && reparsed.refMap.length === parsed.refMap.length)  {
					process.stdout.write("."); // parsing succeeded
				} else {
					process.stdout.write("F"); // unexpected result
				}
			} catch(e) {
				process.stdout.write("E"+"\n"); // parsing failed via exception
				process.stderr.write(e.toString()+"\n");
				process.stderr.write(testFile+"\n");
			}
		}
	}
}


function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const val of a) {
    if (!b.has(val)) return false;
  }
  return true;
}