import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, generate_template, Bundles, MainModule, AuxiliaryModule
from youwol.utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')

project_externals = {
    "@youwol/os-core": "^0.1.12",
    "@youwol/cdn-client": "^2.0.4",
    "@youwol/http-clients": "^2.0.5",
    "@youwol/http-primitives": "^0.1.2",
    "@youwol/flux-view": "^1.0.3",
    "@youwol/fv-group": "^0.2.3",
    "@youwol/fv-input": "^0.2.1",
    "rxjs": "^6.5.5",
    # used by favorites view when displaying info, fetch in due time (not at load time)
    "marked": "^4.2.3"
}
template = Template(
    path=folder_path,
    type=PackageType.Library,
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
            loadDependencies=["@youwol/cdn-client"]
        ),
        auxiliaryModules=[
            AuxiliaryModule(
                name="favorites",
                entryFile="./lib/favorites/index.ts",
                loadDependencies=["@youwol/cdn-client", "@youwol/flux-view", "rxjs", "@youwol/http-clients",
                                  "@youwol/os-core", "@youwol/fv-group"]
            ),
            AuxiliaryModule(
                name="webpm-package-info",
                entryFile="./lib/webpm-package-info/index.ts",
                loadDependencies=["@youwol/cdn-client", "@youwol/flux-view", "rxjs", "@youwol/http-clients",
                                  "@youwol/http-primitives", "@youwol/fv-input"]
            ),
            AuxiliaryModule(
                name="file-info",
                entryFile="./lib/file-info/index.ts",
                loadDependencies=["@youwol/flux-view", "rxjs", "@youwol/http-clients", "@youwol/http-primitives"]
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
