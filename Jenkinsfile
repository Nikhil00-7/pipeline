pipeline {

    agent any 

    tools {
        nodejs "node22"
    }
    
    def services = ['user', 'ride', 'captain', 'gateway']
    
    environment {
        PATH = "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        MAX_RETRIES= "3"
        DELAY_RETRIES= "30"
    }
    options {
      timestamp()
      timeout(time: 1 , units: "HOURS")
    }

    parameters{
       booleanParam (name: "SKIPS_TEST" , defaultValue: true , description: "Skip test stage")
       
       booleanParam( name: "SKIPS_BUILD" , defaultValue: true , description: "Skip build stage")
 

    }

    stages {

        stage("Checkout Code") {
            steps {
                git branch: 'main', url: 'https://github.com/Nikhil00-7/pipeline.git'
            }
        }

        stage("Install Dependencies") {
           steps{
            def max_retries = env.MAX_RETRIES.toInteger()
            def delay = env.DELAY_RETRIES.toInteger()

            script{
               for(service in services){
                for (int attempts = 1; attempts<= max_retries; attempts++){
                   try{
                      dir(service){
                        sh "npm install"
                      }
                       echo "${service}  dependency  install successful"
                     break
                   }catch(Exception e){
                     echo "Attempts ${attempts}/${max_retries} failed for ${service}  service"

                     if(i == max_retries){
                      error("Failed to install dependency for service ${service}")
                     }
                         echo "Waiting ${delay} seconds before retry..."
                         sleep(time: delay , uits: "SECONDS")
                   }
                }
               }
             }
           }
        }

        stage("Build Services") {
          when {
            expression {params.SKIPS_BUILD == false}
          }
            steps{
              def max_retries = env.MAX_RETRIES.toInteger()
              def delay = env.DELAY_RETRIES.toInteger()
              script{
               for (service in services){
                for (int attempts= 1 ; attempts<= max_retries ; attempts++){
                    try{
                        dir(service){
                          sh "npm run build || echo 'No build script'"
                        }
                         echo "${service} build complete successful"
                         break
                    }catch(Exception e){
                       echo "Attempts ${attempts}/${max_retries} failed for ${service}  service"

                     if(i == max_retries){
                      error("Failed to build for service ${service}")
                     }
                         echo "Waiting ${delay} seconds before retry..."
                         sleep(time: delay , uits: "SECONDS")
                    }
                  }
                }   
              }
            }
        }

        stage("Run Tests") {
           when{
            expression {params.SKIPS_TEST== false}
           }

           steps{
              def max_retries = env.MAX_RETRIES.toInteger()
              def delay = env.DELAY_RETRIES.toInteger()

             script{
              for (service in services){
                for (int attempts = 1; attempts<= max_retries ; attempts++){
                  try{
                     dir(service){
                       sh "npm test"
                     }
                     echo "${service} test pass successful"
                     break
                  }catch(Exception e){
                      echo "Attempts ${attempts}/${max_retries} failed for ${service}  service"

                     if(i == max_retries){
                      error("Failed to test for service ${service}")
                     }
                         echo "Waiting ${delay} seconds before retry..."
                         sleep(time: delay , uits: "SECONDS")
                  }
                }
              }
             }
           }
        }

        stage("Create Artifact") {
            steps {
              def max_retries = env.MAX_RETRIES.toInteger()
              def delay = env.DELAY_RETRIES.toInteger()
                script {
                    for(service in services){
                      for (int attempts =1  ; attempts<= max_retries ; attempts++){
                        try{
                           dir(service){
                            sh "zip -r ${service}.zip ."
                           }
                        }catch(Exception e){
                         echo "Attempts ${attempts}/${max_retries} failed for ${service}  service"

                     if(i == max_retries){
                      error("Failed to create artifact for ${service}")
                     }
                         echo "Waiting ${delay} seconds before retry..."
                         sleep(time: delay , uits: "SECONDS")
                        }
                      }
                    }
                }
            }
        }

        stage("Archive Artifact") {
            steps {
                archiveArtifacts artifacts: '**/*.zip', fingerprint: true
            }
        }


        stage("Build Docker Image") {
            steps {
                script {
                    def services = ['user', 'ride', 'captain', 'gateway']
                    for (service in services) {
                        dir(service) {
                            sh "docker build -t docdon0007/${service}:${env.BUILD_NUMBER} ."
                        }
                    }
                }
            }
        }


        // stage("Push to ECR") {
        //     steps {
        //         withCredentials([[
        //             $class: 'AmazonWebServicesCredentialsBinding',
        //             credentialsId: 'aws-creds',
        //             accessKeyVariable: 'aws-access-key',
        //             secretKeyVariable: 'aws-secret-key'
        //         ]]) {
                       
                    
        //             script {
        //                 def services = ['user', 'ride', 'captain', 'gateway']
        //                 def region = "us-east-1"
        //                 def accountId = "YOUR_AWS_ACCOUNT_ID"

        //                 sh """
        //                 aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${accountId}.dkr.ecr.${region}.amazonaws.com
        //                 """

        //                 for (service in services) {
        //                     sh """
        //                     docker tag docdon0007/${service}:${BUILD_NUMBER} ${accountId}.dkr.ecr.${region}.amazonaws.com/${service}:${BUILD_NUMBER}
        //                     docker push ${accountId}.dkr.ecr.${region}.amazonaws.com/${service}:${BUILD_NUMBER}
        //                     """
        //                 }
        //             }
        //         }
        //     }
        // }

        stage("Terraform Init") {
            steps {
                dir("Terraform") {
                    sh "terraform init"
                }
            }
        }

        stage("Terraform Plan") {
            steps {
                dir("Terraform") {
                    sh "terraform plan"
                }
            }
        }

        // stage("Terraform Apply") {
        //     steps {
        //         dir("Terraform") {
        //             sh "terraform apply --auto-approve"
        //         }
        //     }
        // }

        // stage("Deploy to EKS") {
        //     steps {
        //         withCredentials([[
        //             $class: 'AmazonWebServicesCredentialsBinding',
        //             credentialsId: 'aws-creds'
        //         ]]) {

        //             sh '''
        //             aws eks --region us-east-1 update-kubeconfig --name my-cluster
        //             kubectl apply -f k8s/
        //             '''
        //         }
        //     }
        // }
    }

    post {
        always {
            echo "Pipeline finished!"
        }

        success {
            echo "Deployment successful"
            sh "kubectl get pods"
        }

        failure {
            echo "Pipeline failed"
            sh "kubectl get pods || true"
        }
    }
}
