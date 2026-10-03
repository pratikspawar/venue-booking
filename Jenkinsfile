pipeline {
  agent {
    kubernetes {
      yamlFile 'deploy/jenkins/agent-pod.yaml'
    }
  }

  environment {
    REGISTRY = 'ghcr.io/venue-booking'
    IMAGE_TAG = "${env.GIT_COMMIT ? env.GIT_COMMIT.take(8) : 'latest'}"
    API_IMAGE = "${REGISTRY}/api:${IMAGE_TAG}"
    ADMIN_IMAGE = "${REGISTRY}/admin-web:${IMAGE_TAG}"
  }

  options {
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  stages {
    stage('Lint & Type-Check') {
      parallel {
        stage('Shared Package') {
          steps {
            dir('packages/shared') {
              sh 'npm ci && npm run build'
            }
          }
        }
        stage('Admin Web') {
          steps {
            dir('apps/admin-web') {
              sh 'npm ci && npm run build'
            }
          }
        }
      }
    }

    stage('Backend Test') {
      steps {
        container('maven') {
          dir('apps/api') {
            sh './mvnw -B clean verify'
          }
        }
      }
      post {
        always {
          junit 'apps/api/target/surefire-reports/*.xml'
        }
      }
    }

    stage('Container Images Build & Scan') {
      parallel {
        stage('Build API Image') {
          steps {
            container('kaniko') {
              sh """
                /kaniko/executor --context dir://${WORKSPACE}/apps/api \
                  --dockerfile ${WORKSPACE}/deploy/docker/Dockerfile.api \
                  --destination ${API_IMAGE} \
                  --no-push=\${BRANCH_NAME != 'main'}
              """
            }
          }
        }
        stage('Build Admin Web Image') {
          steps {
            container('kaniko') {
              sh """
                /kaniko/executor --context dir://${WORKSPACE}/apps/admin-web \
                  --dockerfile ${WORKSPACE}/deploy/docker/Dockerfile.admin \
                  --destination ${ADMIN_IMAGE} \
                  --no-push=\${BRANCH_NAME != 'main'}
              """
            }
          }
        }
      }
    }

    stage('Security Scan (Trivy)') {
      steps {
        container('trivy') {
          sh "trivy image --exit-code 1 --severity HIGH,CRITICAL ${API_IMAGE}"
        }
      }
    }

    stage('Deploy Staging') {
      when {
        branch 'main'
      }
      steps {
        container('kubectl') {
          withCredentials([file(credentialsId: 'k8s-staging-kubeconfig', variable: 'KUBECONFIG')]) {
            sh '''
              # Apply Flyway migration job before rolling out new application replica
              kubectl apply -f deploy/k8s/overlays/staging/flyway-job.yaml
              kubectl wait --for=condition=complete job/flyway-migration --timeout=180s

              # Update deployment image
              kubectl set image deployment/venue-api api=${API_IMAGE}
              kubectl rollout status deployment/venue-api --timeout=180s
            '''
          }
        }
      }
    }

    stage('Staging Smoke Tests') {
      when {
        branch 'main'
      }
      steps {
        sh 'deploy/scripts/smoke-test.sh https://api-staging.venueplatform.com'
      }
    }
  }

  post {
    failure {
      echo 'Pipeline failed. Sending alert to team webhook...'
    }
  }
}
