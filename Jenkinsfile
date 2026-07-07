// Jenkins credentials expected:
// - dockerhub-credentials: DockerHub username/password
// - snyk-token: Snyk API token
// - sonar-token: SonarQube token
// - sonar-host-url: SonarQube server URL
// TODO: Update credential IDs if Jenkins is configured with different names.

pipeline {
    agent any

    tools {
        nodejs 'node22'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_REPO = 'fedil/securenotes-backend'
        IMAGE_MAIN_TAG = 'main'
        IMAGE_LATEST_TAG = 'latest'
    }

    stages {
        stage('Checkout') {
            when {
                allOf {
                    anyOf {
                        branch 'main'
                        branch 'production'
                    }

                    anyOf{
                        changeset "backend/**"
                        changeset "Jenkinsfile"
                    }
                }
            }

            steps {
                checkout scm

                script {
                    env.GIT_SHA = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()

                    env.IMAGE_SHA_TAG = "sha-${env.GIT_SHA}"
                }

                echo "Building backend image for commit: ${env.GIT_SHA}"
            }
        }

        stage('Install | Backend Dependencies') {
            when {
                allOf {
                    anyOf {
                        branch 'main'
                        branch 'production'
                    }

                    anyOf{
                        changeset "backend/**"
                        changeset "Jenkinsfile"
                    }                }
            }

            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Linting | Snyk Dependency Scan') {
            when {
                allOf {
                    anyOf {
                        branch 'main'
                        branch 'production'
                    }

                    anyOf{
                        changeset "backend/**"
                        changeset "Jenkinsfile"
                    }                }
            }

            steps {
                withCredentials([
                    string(credentialsId: 'snyk-token', variable: 'SNYK_TOKEN')
                ]) {
                    dir('backend') {
                        sh '''
                            npx snyk test \
                              --severity-threshold=high \
                              --sarif-file-output=snyk.sarif \
                              --file=package.json
                        '''
                    }
                }
            }

            post {
                always {
                    archiveArtifacts artifacts: 'backend/snyk.sarif', allowEmptyArchive: true
                }
            }
        }

        stage('Linting | SonarQube Static Analysis') {
            when {
                allOf {
                    anyOf {
                        branch 'main'
                        branch 'production'
                    }

                    anyOf{
                        changeset "backend/**"
                        changeset "Jenkinsfile"
                    }                }
            }

            steps {
                withCredentials([
                    string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN'),
                    string(credentialsId: 'sonar-host-url', variable: 'SONAR_HOST_URL')
                ]) {
                    dir('backend') {
                        sh 'npm run sonar:scan'
                    }
                }
            }
        }

        stage('Test | Run Unit Tests') {
            when {
                allOf {
                    anyOf {
                        branch 'main'
                        branch 'production'
                    }

                    anyOf{
                        changeset "backend/**"
                        changeset "Jenkinsfile"
                    }                }
            }
            
            steps {
                dir('backend') {
                    sh 'npm run test'
                }
            }

            post {
                always {
                    archiveArtifacts artifacts: 'backend/coverage/**', allowEmptyArchive: true
                }
            }
        }

        stage('Build | Backend Application') {
            when {
                allOf {
                    anyOf {
                        branch 'main'
                        branch 'production'
                    }

                    anyOf{
                        changeset "backend/**"
                        changeset "Jenkinsfile"
                    }                }
            }

            steps {
                dir('backend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Build | Backend Docker Image') {
            when {
                allOf {
                    anyOf {
                        branch 'main'
                        branch 'production'
                    }

                    anyOf{
                        changeset "backend/**"
                        changeset "Jenkinsfile"
                    }                }
            }
                        
            steps {
                sh '''
                    docker build \
                      --target=live \
                      -t ${IMAGE_REPO}:${IMAGE_SHA_TAG} \
                      -t ${IMAGE_REPO}:${IMAGE_MAIN_TAG} \
                      -t ${IMAGE_REPO}:${IMAGE_LATEST_TAG} \
                      backend
                '''
            }
        }

        stage('Deliver | Push Backend Image to DockerHub') {
            when {                
                allOf {
                    branch 'production'


                anyOf{
                    changeset "backend/**"
                    changeset "Jenkinsfile"
                }                }
            }

            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        echo "$DOCKERHUB_TOKEN" | docker login \
                          --username "$DOCKERHUB_USERNAME" \
                          --password-stdin

                        docker push ${IMAGE_REPO}:${IMAGE_SHA_TAG}
                        docker push ${IMAGE_REPO}:${IMAGE_MAIN_TAG}
                        docker push ${IMAGE_REPO}:${IMAGE_LATEST_TAG}
                    '''
                }
            }

            post {
                always {
                    sh 'docker logout || true'
                }
            }
        }

        // TODO: Replace this placeholder with the blue/green deployment command once finalized.
        stage('Stage | Blue-Green') {
            when {
                allOf {
                    branch 'production'
    
                anyOf{
                    changeset "backend/**"
                    changeset "Jenkinsfile"
                }                }
            }

            steps {
                sshagent(credentials: ['ec2-deploy']) {
                    sh """
                        ssh ubuntu@10.0.0.12 "
                            cd deployment && \
                            ./blue-green-deploy.sh stage --service api ${IMAGE_SHA_TAG}
                        "
                    """
                }
            }
        }

        stage('Deploy | Blue-Green') {
            when {
                branch 'production'
            
                anyOf{
                    changeset "backend/**"
                    changeset "Jenkinsfile"
                }
            }

            steps {
                sshagent(credentials: ['ec2-deploy']) {
                    sh '''
                        ssh ubuntu@10.0.0.12 '
                            cd deployment && \
                            ./blue-green-deploy.sh promote --service api
                        '
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Backend Jenkins pipeline completed successfully.'
        }

        failure {
            echo 'Backend Jenkins pipeline failed. Check the failed stage logs above.'
        }

        always {
            deleteDir()
        }
    }
}