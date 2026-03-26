                         Microservices Deployment on AWS EKS: Production-Ready Terraform + Jenkins CI/CD Guide

## Project Overview & Objectives

This project demonstrates a production-ready microservices deployment on Amazon Web Services, showcasing expertise in cloud infrastructure, containerization, orchestration, and DevOps automation. The system is designed to handle real-world challenges such as scalability, high availability, and observability.

A fully automated CI/CD pipeline has been implemented using Jenkins, enabling seamless integration, testing, container image creation, and deployment. The pipeline builds and pushes Docker images to Amazon Elastic Container Registry and deploys them to Amazon Elastic Kubernetes Service, ensuring fast, reliable, and repeatable releases.

Additionally, disaster recovery and data protection strategies have been implemented using Amazon S3. This includes:

- Versioning-enabled S3 buckets for data retention
- Cross-bucket replication for backup and recovery
- Server-side encryption (AES-256) for data security
- Public access blocking to ensure compliance and privacy

These configurations ensure high durability, fault tolerance, and protection against data loss in failure scenarios.

The project integrates tools and technologies like Docker, Kubernetes, Terraform, and monitoring solutions to deliver an end-to-end DevOps workflow aligned with industry best practices.


## Tech Stack

- Cloud: AWS
- CI/CD: Jenkins
- Containerization: Docker
- Orchestration: Kubernetes (EKS)
- IaC: Terraform
- Storage: S3 (Disaster Recovery)
- Monitoring: Prometheus, Grafana


## Infrastructure Setup

All infrastructure is provisioned using Terraform with modular design, enabling reusable, maintainable, and scalable infrastructure on Amazon Web Services

## Terraform Modules Overview

- vpc	= Creates a secure private network with public/private subnets, NAT gateways, route tables, and multi-AZ setup for high availability.

- eks = Provisions a managed EKS cluster with worker nodes, IAM integration, auto-scaling, and Kubernetes networking for deploying microservices.

- s3 = Creates primary and replication buckets with versioning, server-side encryption, replication, and public access block for disaster recovery.

- iam = Manages IAM roles and policies for EKS, S3 replication, and other AWS resources, following the principle of least privilege.

- irsa = Configures IAM Roles for Service Accounts (IRSA) to securely allow Kubernetes pods to access AWS services.

- oidc =  Sets up an OIDC provider for EKS to enable secure pod authentication to AWS resources.

- alb = Creates an Application Load Balancer for routing traffic to microservices deployed in the EKS cluster.

- securityGroup = Configures security groups for VPC, EKS, and ALB to control inbound/outbound traffic securely.

## CI/CD Pipeline

* Checkout → Install → Build → Test → Docker Build → Push to ECR → Deploy to EKS

* Highlight automated testing, Docker image versioning, and deployment steps


## Prerequisites

- AWS account (with IAM user/role having broad permissions for demo)

- AWS CLI v2 configured (`aws configure`)

- Terraform ≥ 1.6

- kubectl ≥ 1.28

- Docker (for local testing)

- Jenkins server (or deploy via Terraform)


 ## Repository Structure

<pre>
.
├── terraform/
│   ├── modules/                # Reusable modules: vpc, eks, s3, iam, irsa, alb, security-group, ...
│   ├── environments/
│   │   └── dev/                # Environment-specific config (variables.tf, main.tf, etc.)
│   └── ...
├── jenkins/
│   └── Jenkinsfile             # Declarative pipeline definition
├── k8s/                        # Optional: YAML manifests or Helm values
├── docs/
│   └── architecture.png        # Diagram file
└── README.md
</pre>


## Observability

- Prometheus + Grafana via Helm (kube-prometheus-stack)

- Dashboards: cluster resources, node health, pod metrics, custom app metrics (if /metrics exposed)

- Alerting rules (high CPU, pod crashloop, etc.)

- Access: port-forward Grafana or expose via Ingress


## Security Features

- Principle of least privilege (IRSA over node IAM roles)

- OIDC provider + no long-lived credentials

- Security Groups + Network Policies (recommended add-on)

- S3: Server-side encryption, public access blocked, versioning & replication


## Disaster Recovery & Data Protection

- Versioning-enabled S3 buckets

- Cross-bucket / cross-region replication

- AES-256 server-side encryption

- MFA delete & public access block enabled


## Scaling & High Availability

- Multi-AZ deployment (control plane & nodes)

- Cluster Autoscaler

- Horizontal Pod Autoscaler (HPA) ready

- ALB for load distribution


## Future Improvements / Roadmap

- GitOps with ArgoCD or Flux

- Service Mesh (Istio/Linkerd)

- cert-manager + ExternalDNS

- Canary / blue-green deployments

- AWS X-Ray / CloudWatch Container Insights

- Cost optimization (Spot nodes, Savings Plans)









