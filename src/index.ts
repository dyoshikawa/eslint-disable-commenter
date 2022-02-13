import { Command } from 'commander'
import { ESLint } from 'eslint'
import uniq from 'lodash.uniq'
import fs from 'fs'

const main = async () => {
  const program = new Command()
  program
    .name('eslint-disable-commenter')
    .description('eslint-disable-commenter')
    .version(process.env.npm_package_version!)
    .argument('<path>', 'File path patterns. Example: ./**/*.{js,jsx,ts,tsx}')
    .option(
      '-c, --config <path>',
      'Config file path',
      './.eslintrc.{json,js,yaml,yml}'
    )
    .option('-o, --output-result-file [path]', 'Example: ./result.json')
  // TODO
  // .option('-t, --comment-type [type]', 'Value: "file" or "line"', 'file')

  program.parse()

  const [filePathPatterns] = program.args
  const { config: configPath, outputResultFile: outputResultFilePath } =
    program.opts<{
      config: string
      outputResultFile?: string
      // TODO
      // commentType: 'file' | 'line'
    }>()

  const esLint = new ESLint({
    fix: false, // Not "eslint --fix"
  })

  // Read .eslintrc
  esLint.calculateConfigForFile(configPath)

  const result = await esLint.lintFiles(filePathPatterns.split(','))
  if (outputResultFilePath != null) {
    fs.writeFileSync(outputResultFilePath, JSON.stringify(result, null, 2))
  }

  // if ()

  // eslint-disable-next-line no-restricted-syntax
  for (const item of result) {
    if (item.messages.length === 0) {
      // eslint-disable-next-line no-continue
      continue
    }

    const ruleIds = [
      ...uniq(
        item.messages
          .map(({ ruleId }) => ruleId)
          .filter((v) => v != null) as string[]
      ),
    ].sort()

    // Generate eslint disable comments
    const eslintDisableComments = `${ruleIds
      .map((ruleId) => `/* eslint ${ruleId}: 0 */`)
      .join('\n')}\n\n`

    // Get the existing contents of the file
    const fileContent = fs.readFileSync(item.filePath).toString()

    // Add comments to the beginning of the file
    const newFileContent = eslintDisableComments + fileContent
    fs.writeFileSync(item.filePath, newFileContent)
  }
}

main()
