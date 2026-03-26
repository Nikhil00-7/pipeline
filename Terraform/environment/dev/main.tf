
module "vpc" {
  source      = "../../modules/vpc"
  
  application  = "uber-app"          
  cidr_block   = "10.0.0.0/16"      
  environment  = "dev"
  cluster_name = "uber-eks-cluster"

}



module "iam" {
  source = "../../modules/iam"
  environment=  "dev"
 iam_role_eks= "cluster-role"
oidc_provider_arn = module.oidc.oidc_provider_arn
 bucket_name = var.bucket_name
 backup_policy = var.backup_policy
 velero_role = var.velero_role
}

module "eks" {
  source = "../../modules/eks"
  
  subnet_ids               = module.vpc.private_subnet_ids
  endpoint_public_access   = true
  endpoint_private_access  = false
  public_access_cidrs      = ["0.0.0.0/0"]
  
  cluster_name             = var.cluster_name
  cluster_role_arn         = module.iam.eks_cluster_role_arn
  vpc_id                   = module.vpc.vpc_id
  node_group_name          = var.node_group_name
  node_role_arn            = module.iam.eks_node_role_arn
}


module "alb" {
  source           = "../../modules/alb"
  node_role_name   = module.iam.eks_node_role_name   
  aws_region       = "us-east-1"
  eks_cluster_name = module.eks.eks_cluster_name
  alb_role_arn  =  module.irsa.lb_role_arn
   external_dns_role_arn = module.irsa.external_dns_role_arn
}

module "oidc"{
 source = "../../modules/oidc"
 oidc_url =  module.eks.oidc_url
}

module "irsa"{
source = "../../modules/irsa"
oidc_url = module.eks.oidc_url
oidc_provider_arn = module.oidc.oidc_provider_arn
}


module "s3"{
source = "../../modules/s3"
environment = var.environment
bucket_name = "var.bucket_name"
source_replica_bucket_name = "source_replica_bucket_name"
velero_role_arn = module.iam.velero_role_arn
}

data "aws_eks_cluster_auth"  "cluster"{
  name = module.eks.eks_cluster_name
}


provider "kubernetes" {

  host = module.eks.eks_cluster_endpoint

  cluster_ca_certificate = base64decode(module.eks.eks_cluster_certificate_authority)

  token = data.aws_eks_cluster_auth.cluster.token
}

