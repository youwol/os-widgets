import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, generate_template, Bundles, MainModule, AuxiliaryModule
from youwol.utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')

project_externals = {
    "@youwol/os-core": "^0.2.0",
    "@youwol/webpm-client": "^3.0.0",
    "@youwol/http-clients": "^3.0.0",
    "@youwol/http-primitives": "^0.2.0",
    "@youwol/rx-vdom": "^1.0.1",
    "@youwol/rx-group-views": "^0.3.0",
    "@youwol/rx-tab-views": "^0.3.0",
    "@youwol/rx-input-views": "^0.3.0",
    "@youwol/rx-button-views": "^0.2.0",
    "rxjs": "^7.5.6",
    # used by favorites view when displaying info, fetch in due time (not at load time)
    "marked": "^4.2.3"
}
template = Template(
    path=folder_path,
    type=PackageType.LIBRARY,
    name=pkg_json['name'],
    version=pkg_json['version'],
    shortDescription=pkg_json['description'],
    author=pkg_json['author'],
    dependencies=Dependencies(
        runTime=RunTimeDeps(
            externals=project_externals
        )
    ),
    bundles=Bundles(
        mainModule=MainModule(
            entryFile='./index.ts',
            loadDependencies=["@youwol/webpm-client"]
        ),
        auxiliaryModules=[
            AuxiliaryModule(
                name="favorites",
                entryFile="./lib/favorites/index.ts",
                loadDependencies=["@youwol/webpm-client", "@youwol/rx-vdom", "rxjs", "@youwol/http-clients",
                                  "@youwol/os-core", "@youwol/rx-group-views"]
            ),
            AuxiliaryModule(
                name="webpm-package-info",
                entryFile="./lib/webpm-package-info/index.ts",
                loadDependencies=["@youwol/webpm-client", "@youwol/rx-vdom", "rxjs", "@youwol/http-clients",
                                  "@youwol/http-primitives", "@youwol/rx-input-views"]
            ),
            AuxiliaryModule(
                name="file-info",
                entryFile="./lib/file-info/index.ts",
                loadDependencies=["@youwol/rx-vdom", "rxjs", "@youwol/http-clients", "@youwol/http-primitives"]
            ),
            AuxiliaryModule(
                name="about-youwol",
                entryFile="./lib/about-youwol/index.ts",
                loadDependencies=["@youwol/rx-vdom", "rxjs"]
            ),
            AuxiliaryModule(
                name="assets",
                entryFile="./lib/assets/index.ts",
                loadDependencies=["@youwol/rx-vdom", "rxjs", "@youwol/rx-tab-views", "@youwol/rx-button-views"]
            ),
        ]
    ),
    userGuide=True
)

generate_template(template)
shutil.copyfile(
    src=folder_path / '.template' / 'src' / 'auto-generated.ts',
    dst=folder_path / 'src' / 'auto-generated.ts'
)
for file in ['README.md', '.gitignore', '.npmignore', '.prettierignore', 'LICENSE', 'package.json',
             'tsconfig.json', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )
