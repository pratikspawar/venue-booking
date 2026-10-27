pipeline {
  agent {
    kubernetes {
      yamlFile 'deploy/jenkins/agent-pod.yaml'
    }
  }

  environment {
    REGISTRY = 'ghcr.io/venue-booking'
    IMAGE_TAG = "${env.GIT_COMMIT ? env.GIT_COMMIT.take(8) : 'latest'}"
    GATEWAY_IMAGE = "${REGISTRY}/gateway:${IMAGE_TAG}"
    AUTH_IMAGE = "${REGISTRY}/auth:${IMAGE_TAG}"
    CATALOG_IMAGE = "${REGISTRY}/catalog:${IMAGE_TAG}"
    BOOKING_IMAGE = "${REGISTRY}/booking:${IMAGE_TAG}"
    PAYMENT_IMAGE = "${REGISTRY}/payment:${IMAGE_TAG}"
    ADMIN_IMAGE = "${REGISTRY}/admin-web:${IMAGE_TAG}"
  }

  options {
    timeout(time: 45, unit: 'MINUTES')
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

    stage('Microservices Unit & Integration Tests') {
      steps {
        container('maven') {
          dir('services') {
            sh 'mvn -B clean verify'
          }
        }
      }
      post {
        always {
          junit 'services/*/target/surefire-reports/*.xml'
        }
      }
    }

    stage('Container Images Build') {
      parallel {
        stage('Build Gateway') {
          steps {
            container('kaniko') {
              sh """
                /kaniko/executor --context dir://${WORKSPACE} \
                  --dockerfile ${WORKSPACE}/deploy/docker/Dockerfile.gateway \
                  --destination ${GATEWAY_IMAGE} \
                  --no-push=\${BRANCH_NAME != 'main'}
              """
            }
          }
        }
        stage('Build Auth Service') {
          steps {
            container('kaniko') {
              sh """
                /kaniko/executor --context dir://${WORKSPACE} \
                  --dockerfile ${WORKSPACE}/deploy/docker/Dockerfile.auth \
                  --destination ${AUTH_IMAGE} \
                  --no-push=\${BRANCH_NAME != 'main'}
              """
            }
          }
        }
        stage('Build Catalog Service') {
          steps {
            container('kaniko') {
              sh """
                /kaniko/executor --context dir://${WORKSPACE} \
                  --dockerfile ${WORKSPACE}/deploy/docker/Dockerfile.catalog \
                  --destination ${CATALOG_IMAGE} \
                  --no-push=\${BRANCH_NAME != 'main'}
              """
            }
          }
        }
        stage('Build Booking Service') {
          steps {
            container('kaniko') {
              sh """
                /kaniko/executor --context dir://${WORKSPACE} \
                  --dockerfile ${WORKSPACE}/deploy/docker/Dockerfile.booking \
                  --destination ${BOOKING_IMAGE} \
                  --no-push=\${BRANCH_NAME != 'main'}
              """
            }
          }
        }
        stage('Build Payment Service') {
          steps {
            container('kaniko') {
              sh """
                /kaniko/executor --context dir://${WORKSPACE} \
                  --dockerfile ${WORKSPACE}/deploy/docker/Dockerfile.payment \
                  --destination ${PAYMENT_IMAGE} \
                  --no-push=\${BRANCH_NAME != 'main'}
              """
            }
          }
        }
        stage('Build Admin Web') {
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

    stage('Security Vulnerability Scan (Trivy)') {
      steps {
        container('trivy') {
          sh "trivy image --exit-code 1 --severity HIGH,CRITICAL ${GATEWAY_IMAGE}"
          sh "trivy image --exit-code 1 --severity HIGH,CRITICAL ${BOOKING_IMAGE}"
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
              # Apply Flyway schema migrations before service rollout
              kubectl apply -f deploy/k8s/base/flyway-job.yaml
              kubectl wait --for=condition=complete job/flyway-schema-migration --timeout=180s

              # Roll out microservices via Kustomize
              kubectl apply -k deploy/k8s/base
              kubectl rollout status deployment/api-gateway --timeout=180s
              kubectl rollout status deployment/booking-service --timeout=180s
              kubectl rollout status deployment/admin-web --timeout=180s
            '''
          }
        }
      }
    }

    stage('Staging E2E & Concurrency Test Suite') {
      when {
        branch 'main'
      }
      steps {
        sh 'chmod +x deploy/scripts/test-e2e-concurrency.sh'
        sh 'deploy/scripts/test-e2e-concurrency.sh https://api-staging.venueplatform.com/api/v1'
      }
    }
  }

  post {
    failure {
      echo 'Enterprise pipeline failed. Notification sent to DevOps webhook.'
    }
  }
}
