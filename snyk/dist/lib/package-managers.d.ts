export declare type SupportedPackageManagers = 'rubygems' | 'npm' | 'yarn' | 'maven' | 'pip' | 'sbt' | 'gradle' | 'golangdep' | 'govendor' | 'gomodules' | 'nuget' | 'paket' | 'composer' | 'cocoapods' | 'poetry' | 'hex';
export declare enum SUPPORTED_MANIFEST_FILES {
    GEMFILE = "Gemfile",
    GEMFILE_LOCK = "Gemfile.lock",
    GEMSPEC = ".gemspec",
    PACKAGE_LOCK_JSON = "package-lock.json",
    POM_XML = "pom.xml",
    JAR = ".jar",
    WAR = ".war",
    BUILD_GRADLE = "build.gradle",
    BUILD_GRADLE_KTS = "build.gradle.kts",
    BUILD_SBT = "build.sbt",
    YARN_LOCK = "yarn.lock",
    PACKAGE_JSON = "package.json",
    PIPFILE = "Pipfile",
    SETUP_PY = "setup.py",
    REQUIREMENTS_TXT = "requirements.txt",
    GOPKG_LOCK = "Gopkg.lock",
    GO_MOD = "go.mod",
    VENDOR_JSON = "vendor.json",
    PROJECT_ASSETS_JSON = "project.assets.json",
    PACKAGES_CONFIG = "packages.config",
    PROJECT_JSON = "project.json",
    PAKET_DEPENDENCIES = "paket.dependencies",
    COMPOSER_LOCK = "composer.lock",
    PODFILE_LOCK = "Podfile.lock",
    COCOAPODS_PODFILE_YAML = "CocoaPods.podfile.yaml",
    COCOAPODS_PODFILE = "CocoaPods.podfile",
    PODFILE = "Podfile",
    POETRY_LOCK = "poetry.lock",
    MIX_EXS = "mix.exs"
}
export declare const SUPPORTED_PACKAGE_MANAGER_NAME: {
    readonly [packageManager in SupportedPackageManagers]: string;
};
export declare const GRAPH_SUPPORTED_PACKAGE_MANAGERS: SupportedPackageManagers[];
export declare const PINNING_SUPPORTED_PACKAGE_MANAGERS: SupportedPackageManagers[];
export declare const REACHABLE_VULNS_SUPPORTED_PACKAGE_MANAGERS: SupportedPackageManagers[];
