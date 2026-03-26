variable "eks_cluster_name" {
    type = string
}

variable "aws_region" {
   type = string
}

variable "node_role_name" {
  type = string
}

variable "external_dns_role_arn" {
  type= string
}

variable "alb_role_arn" {
  type = string
}