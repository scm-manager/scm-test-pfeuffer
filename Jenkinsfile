#!groovy
@Library(['github.com/cloudogu/ces-build-lib@1.62.0', 'github.com/cloudogu/dogu-build-lib@v1.4.1', 'github.com/cloudogu/zalenium-build-lib@3092363']) _
import com.cloudogu.ces.cesbuildlib.*
import com.cloudogu.ces.dogubuildlib.*

def NAMESPACES = ["testing", "official"]
def IGNORE_TAG = "ignore-tag"
def BUILD_TAG = "build-existing-tag"
def TAG_STRATEGIES = [IGNORE_TAG, BUILD_TAG]

Git git = new Git(this, "cesmarvin")
GitHub github = new GitHub(this, git)
Changelog changelog = new Changelog(this)

node('vagrant') {

    String cronTrigger = BRANCH_NAME == "develop" ? "@daily" : ""

    timestamps {
        def props = [];
        props.add(string(defaultValue: getScmReleaseVersion(), description: 'SCM Version', name: 'ScmVersion', trim: true))
        props.add(string(defaultValue: getDoguReleaseCounter(), description: 'Dogu Version Counter', name: 'DoguVersionCounter', trim: true))
        props.add(choice(name: 'Tag_Strategy', choices: TAG_STRATEGIES))
        for (namespace in NAMESPACES) {
            props.add(booleanParam(defaultValue: isReleaseBuild(), description: "Push new dogu into registry with namespace '${namespace}'", name: "Push_${namespace}"))
        }
        properties([
                // Keep only the last x builds to preserve space
                buildDiscarder(logRotator(numToKeepStr: '10')),
                // Don't run concurrent builds for a branch, because they use the same workspace directory
                disableConcurrentBuilds(),
                parameters(props),
                pipelineTriggers([cron(cronTrigger)]),
        ])

        catchError {

            EcoSystem ecoSystem = new EcoSystem(this, "gcloud-ces-operations-internal-packer", "jenkins-gcloud-ces-operations-internal")

            stage('Checkout') {
                checkout([
                        $class                           : 'GitSCM',
                        branches                         : scm.branches,
                        doGenerateSubmoduleConfigurations: scm.doGenerateSubmoduleConfigurations,
                        extensions                       : scm.extensions + [[$class: 'CleanBeforeCheckout'], [$class: 'LocalBranch']],
                        userRemoteConfigs                : scm.userRemoteConfigs
                ])
            }

            stage('Check for tag') {
                if (params.Tag_Strategy != IGNORE_TAG) {
                    sh "git fetch --tags"
                    def tags = sh(returnStdout: true, script: 'git tag -l').trim().readLines()
                    if (params.Tag_Strategy == BUILD_TAG) {
                        if (!tags.contains(version)) {
                            error("Git tag ${version} does not exist.")
                        }
                        sh "git checkout 'refs/tags/${version}'"
                    } else if (isReleaseBuild() && tags.contains(version)) {
                        error("Git tag ${version} already exists.")
                    }
                }
            }

            stage('Apply Parameters') {
                if (isReleaseBuild()) {
                    echo 'update dependencies for release build'
                    sh 'echo "This has been released" >> Dockerfile'

                    sh 'git add Dockerfile dogu.json'
                    commit "Release version ${releaseVersion}"

                    // fetch all remotes from origin
                    sh 'git config --replace-all "remote.origin.fetch" "+refs/heads/*:refs/remotes/origin/*"'
                    sh 'git fetch --all'

                    // checkout, reset and merge
                    sh 'git checkout master'
                    sh 'git reset --hard origin/master'
                    sh "git merge --ff-only ${env.BRANCH_NAME}"

                    tag getVersion()
                }
            }

            try {

                stage('Push changes to remote repository') {
                    if (isReleaseBuild()) {
                        sh returnStatus: true, script: "git branch -D develop"
                        sh "git checkout develop"
                        sh "git -c user.name='CES Marvin' -c user.email='cesmarvin@cloudogu.com' merge master"

                        authGit 'cesmarvin', 'push origin master --tags'
                        authGit 'cesmarvin', 'push origin develop --tags'
                        authGit 'cesmarvin', "push origin :${env.BRANCH_NAME}"
                    }
                }

                stage('Add Github-Release') {
                    if (isReleaseBuild()) {
                        github.createReleaseWithChangelog(version, changelog)
                    }
                }
            } finally {
                stage('Clean') {
                    ecoSystem.destroy()
                }
            }
        }
        if (currentBuild.currentResult == 'FAILURE') {
            mail to: "scm-team@cloudogu.com",
                    subject: "${JOB_NAME} - Build #${BUILD_NUMBER} - ${currentBuild.currentResult}!",
                    body: "Check console output at ${BUILD_URL} to view the results."
        }
    }
}


String getVersion() {
    if (params.ScmVersion != null && !params.ScmVersion.isEmpty()) {
        return "${params.ScmVersion}-${params.DoguVersionCounter}"
    }
    return null
}

boolean containsReleasePackage(release, packageType) {
    boolean exists = false
    for (int i=0; i < release.packages.size(); i++ ) {
        if (release.packages[i].type == packageType) {
            exists = true
            break
        }
    }
    return exists
}

boolean isNightly() {
    return currentBuild.getBuildCauses('hudson.triggers.TimerTrigger$TimerTriggerCause').size() > 0
}

boolean isReleaseBuild() {
    return env.BRANCH_NAME.startsWith("release/")
}

String getReleaseVersion() {
    if (isReleaseBuild()) {
        return env.BRANCH_NAME.substring("release/".length())
    }
    return ""
}

String getScmReleaseVersion() {
    String doguVersion = getReleaseVersion()
    int separator = doguVersion.lastIndexOf('-')
    if (separator > 0) {
        return doguVersion.substring(0, separator)
    }
    return ""
}

String getDoguReleaseCounter() {
    String doguVersion = getReleaseVersion()
    int separator = doguVersion.lastIndexOf('-')
    if (separator > 0) {
        return doguVersion.substring(separator + 1)
    }
    return '1'
}

void authGit(String credentials, String command) {
  withCredentials([
    usernamePassword(credentialsId: credentials, usernameVariable: 'AUTH_USR', passwordVariable: 'AUTH_PSW')
  ]) {
    sh "git -c credential.helper=\"!f() { echo username='\$AUTH_USR'; echo password='\$AUTH_PSW'; }; f\" ${command}"
  }
}

void commit(String message) {
  sh "git -c user.name='CES Marvin' -c user.email='cesmarvin@cloudogu.com' commit -m '${message}'"
}

void tag(String version) {
  String message = "Release version ${version}"
  sh "git -c user.name='CES Marvin' -c user.email='cesmarvin@cloudogu.com' tag -m '${message}' ${version}"
}
